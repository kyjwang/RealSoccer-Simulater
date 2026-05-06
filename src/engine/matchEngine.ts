import { chooseAction } from "@/engine/decisionModel";
import {
  closestOpponent,
  createMatchEvent,
  estimateDribbleSuccess,
  estimatePassSuccess,
  estimateShotModel,
  getDefensivePressure,
  getDistanceToGoal,
  getSupportScore,
  minuteLabel,
  selectPassTarget,
  type RuntimePlayer
} from "@/engine/eventGenerator";
import { clamp, createSeededRandom, distance, randomBetween } from "@/engine/probability";
import { effectiveAttribute, pickMvp } from "@/engine/ratingModel";
import { DEFAULT_SIMULATION_SETTINGS } from "@/data/mockMatches";
import type { MatchEvent } from "@/types/event";
import type { MatchFrame, MatchStats, MatchSummary, TeamStatBlock } from "@/types/match";
import type { Team } from "@/types/team";

type Side = "home" | "away";

type RuntimeTeam = {
  side: Side;
  team: Team;
  players: RuntimePlayer[];
};

export type SimulationOptions = {
  durationMinutes?: number;
  secondsPerTick?: number;
  seed?: string;
};

const createStatBlock = (): TeamStatBlock => ({
  goals: 0,
  possessionTicks: 0,
  shots: 0,
  shotsOnTarget: 0,
  xg: 0,
  passesAttempted: 0,
  passesCompleted: 0,
  tackles: 0,
  fouls: 0,
  corners: 0,
  interceptions: 0
});

const cloneStats = (stats: MatchStats): MatchStats => ({
  home: { ...stats.home },
  away: { ...stats.away }
});

const toRuntimeTeam = (team: Team, side: Side): RuntimeTeam => ({
  side,
  team,
  players: team.players.map((player) => ({
    base: player,
    x: player.x,
    y: player.y,
    stamina: player.stamina
  }))
});

const findRuntimePlayer = (runtimeTeams: RuntimeTeam[], playerId: string): RuntimePlayer | undefined => {
  for (const team of runtimeTeams) {
    const found = team.players.find((player) => player.base.id === playerId);
    if (found) {
      return found;
    }
  }
  return undefined;
};

const findTeamById = (runtimeTeams: RuntimeTeam[], teamId: string): RuntimeTeam => {
  const found = runtimeTeams.find((team) => team.team.id === teamId);
  if (!found) {
    throw new Error(`Team with id ${teamId} not found`);
  }
  return found;
};

const createFrame = (
  tick: number,
  minute: number,
  second: number,
  elapsedSeconds: number,
  runtimeTeams: RuntimeTeam[],
  score: { home: number; away: number },
  ball: { x: number; y: number; teamId: string; carrierPlayerId?: string },
  lastEventId?: string
): MatchFrame => ({
  tick,
  minute,
  second,
  elapsedSeconds,
  ball,
  score,
  players: runtimeTeams.flatMap((team) =>
    team.players.map((player) => ({
      playerId: player.base.id,
      teamId: team.team.id,
      x: player.x,
      y: player.y,
      stamina: player.stamina,
      hasBall: ball.carrierPlayerId === player.base.id
    }))
  ),
  lastEventId
});

const pickGoalkeeper = (team: RuntimeTeam): RuntimePlayer =>
  team.players.find((player) => player.base.position === "GK") ?? team.players[0];

const pickKickoffCarrier = (team: RuntimeTeam): RuntimePlayer => {
  const midfielders = team.players.filter((player) => player.base.position === "MF");
  if (midfielders.length === 0) {
    return team.players[0];
  }

  return midfielders.reduce((best, player) =>
    distance(player.x, player.y, 50, 50) < distance(best.x, best.y, 50, 50) ? player : best
  );
};

const reduceStamina = (team: RuntimeTeam, random: () => number): void => {
  for (const player of team.players) {
    const sprintBias = player.base.position === "FW" || player.base.position === "MF" ? 1.1 : 0.95;
    const tempoLoad = 0.013 + team.team.tempo * 0.015;
    const noise = randomBetween(0.9, 1.1, random);
    player.stamina = Math.max(18, player.stamina - tempoLoad * sprintBias * noise);
  }
};

const moveTowards = (player: RuntimePlayer, targetX: number, targetY: number, maxStep: number): void => {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const dist = Math.hypot(dx, dy);

  if (dist <= 0.001) {
    return;
  }

  const step = Math.min(maxStep, dist);
  player.x += (dx / dist) * step;
  player.y += (dy / dist) * step;
};

const updateTeamShape = (params: {
  team: RuntimeTeam;
  hasPossession: boolean;
  ball: { x: number; y: number; carrierPlayerId?: string };
  homeTeamId: string;
  random: () => number;
}): void => {
  const direction = params.team.team.id === params.homeTeamId ? 1 : -1;

  for (const player of params.team.players) {
    if (params.ball.carrierPlayerId === player.base.id) {
      continue;
    }

    const baseX = player.base.x;
    const baseY = player.base.y;

    const tacticalShiftX =
      direction *
      (params.hasPossession
        ? 6 + params.team.team.attackBias * 8
        : -4 - (1 - params.team.team.defensiveLine) * 6);

    const ballPullX = (params.ball.x - 50) * (params.hasPossession ? 0.07 : 0.04);
    const ballPullY = (params.ball.y - baseY) * (params.hasPossession ? 0.11 : 0.08);

    const keeperFactor = player.base.position === "GK" ? 0.25 : 1;

    const targetX = clamp(baseX + tacticalShiftX * keeperFactor + ballPullX * keeperFactor, 2, 98);
    const targetY = clamp(baseY + ballPullY, 4, 96);

    const pace = effectiveAttribute(player.base, "speed", player.stamina);
    const maxStep = (0.38 + pace * 1.4) * randomBetween(0.9, 1.08, params.random);

    moveTowards(player, targetX, targetY, maxStep);
  }
};

const applyOpenPlayMovement = (params: {
  home: RuntimeTeam;
  away: RuntimeTeam;
  possessionTeamId: string;
  ball: { x: number; y: number; carrierPlayerId?: string };
  homeTeamId: string;
  random: () => number;
}): void => {
  updateTeamShape({
    team: params.home,
    hasPossession: params.possessionTeamId === params.home.team.id,
    ball: params.ball,
    homeTeamId: params.homeTeamId,
    random: params.random
  });

  updateTeamShape({
    team: params.away,
    hasPossession: params.possessionTeamId === params.away.team.id,
    ball: params.ball,
    homeTeamId: params.homeTeamId,
    random: params.random
  });
};

const clampOnPitch = (player: RuntimePlayer): void => {
  player.x = clamp(player.x, 2, 98);
  player.y = clamp(player.y, 2, 98);
};

const placeForKickoff = (home: RuntimeTeam, away: RuntimeTeam): void => {
  for (const player of [...home.players, ...away.players]) {
    player.x = player.base.x;
    player.y = player.base.y;
    clampOnPitch(player);
  }
};

const markContribution = (ledger: Record<string, number>, playerId: string | undefined, amount: number): void => {
  if (!playerId) {
    return;
  }
  ledger[playerId] = (ledger[playerId] ?? 0) + amount;
};

export const simulateMatch = (
  homeTeam: Team,
  awayTeam: Team,
  options: SimulationOptions = {}
): MatchSummary => {
  const durationMinutes = options.durationMinutes ?? DEFAULT_SIMULATION_SETTINGS.durationMinutes;
  const secondsPerTick = options.secondsPerTick ?? DEFAULT_SIMULATION_SETTINGS.secondsPerTick;
  const totalTicks = Math.floor((durationMinutes * 60) / secondsPerTick);
  const seed = options.seed ?? DEFAULT_SIMULATION_SETTINGS.seed;
  const random = createSeededRandom(`${seed}-${homeTeam.id}-${awayTeam.id}`);

  const home = toRuntimeTeam(homeTeam, "home");
  const away = toRuntimeTeam(awayTeam, "away");
  const runtimeTeams = [home, away];

  const stats: MatchStats = {
    home: createStatBlock(),
    away: createStatBlock()
  };

  const events: MatchEvent[] = [];
  const frames: MatchFrame[] = [];
  const statsByTick: MatchStats[] = [];
  const contributions: Record<string, number> = {};

  const score = {
    home: 0,
    away: 0
  };

  let eventCounter = 0;

  const nextEventId = (): string => {
    eventCounter += 1;
    return `evt-${eventCounter}`;
  };

  let possessionTeamId = random() > 0.5 ? home.team.id : away.team.id;
  let possessionTeam = findTeamById(runtimeTeams, possessionTeamId);
  let carrier = pickKickoffCarrier(possessionTeam);

  carrier.x = 50;
  carrier.y = 50;

  const ball = {
    x: 50,
    y: 50,
    teamId: possessionTeamId,
    carrierPlayerId: carrier.base.id
  };

  events.push(
    createMatchEvent({
      id: nextEventId(),
      tick: 0,
      minute: 0,
      type: "kickoff",
      teamId: possessionTeamId,
      x: 50,
      y: 50,
      playerId: carrier.base.id,
      outcome: "neutral",
      description: `0' Kickoff: ${possessionTeam.team.shortName} start the match.`
    })
  );

  frames.push(createFrame(0, 0, 0, 0, runtimeTeams, { ...score }, { ...ball }, events[events.length - 1].id));
  statsByTick.push(cloneStats(stats));

  const getStatBlock = (teamId: string): TeamStatBlock => (teamId === home.team.id ? stats.home : stats.away);
  const getOppositionStatBlock = (teamId: string): TeamStatBlock =>
    teamId === home.team.id ? stats.away : stats.home;

  for (let tick = 1; tick <= totalTicks; tick += 1) {
    const elapsedSeconds = tick * secondsPerTick;
    const minute = Math.max(1, Math.ceil(elapsedSeconds / 60));
    const second = elapsedSeconds % 60;

    reduceStamina(home, random);
    reduceStamina(away, random);

    applyOpenPlayMovement({
      home,
      away,
      possessionTeamId,
      ball,
      homeTeamId: home.team.id,
      random
    });

    possessionTeam = findTeamById(runtimeTeams, possessionTeamId);
    const defendingTeam = possessionTeam.team.id === home.team.id ? away : home;

    carrier = ball.carrierPlayerId
      ? findRuntimePlayer(runtimeTeams, ball.carrierPlayerId) ?? pickKickoffCarrier(possessionTeam)
      : pickKickoffCarrier(possessionTeam);

    const closestToBall = possessionTeam.players.reduce((best, player) =>
      distance(player.x, player.y, ball.x, ball.y) < distance(best.x, best.y, ball.x, ball.y) ? player : best
    );

    if (!carrier || carrier.base.teamId !== possessionTeam.team.id) {
      carrier = closestToBall;
      ball.carrierPlayerId = carrier.base.id;
    }

    moveTowards(carrier, ball.x, ball.y, 1.8);

    const attackingStats = getStatBlock(possessionTeam.team.id);
    const defendingStats = getOppositionStatBlock(possessionTeam.team.id);
    attackingStats.possessionTicks += 1;

    const defensivePressure = getDefensivePressure(carrier, defendingTeam.players, defendingTeam.team);
    const supportScore = getSupportScore(carrier, possessionTeam.players, defendingTeam.players);
    const distanceToGoal = getDistanceToGoal(possessionTeam.team, carrier.x, home.team.id);
    const centrality = clamp(1 - Math.abs(carrier.y - 50) / 50, 0, 1);

    const action = chooseAction(
      {
        carrier: carrier.base,
        carrierStamina: carrier.stamina,
        attackingTeam: possessionTeam.team,
        defendingTeam: defendingTeam.team,
        distanceToGoal,
        defensivePressure,
        supportScore,
        centrality
      },
      random
    );

    const frameEvents: MatchEvent[] = [];

    if (action === "pass" || action === "backpass") {
      const target = selectPassTarget({
        carrier,
        team: possessionTeam.team,
        teammates: possessionTeam.players,
        opponents: defendingTeam.players,
        isBackpass: action === "backpass",
        homeTeamId: home.team.id,
        random
      });

      const successChance = estimatePassSuccess({
        carrier,
        target,
        pressure: defensivePressure,
        random
      });

      attackingStats.passesAttempted += 1;

      const success = random() < successChance;

      if (success) {
        attackingStats.passesCompleted += 1;

        const landingX = clamp(target.x + randomBetween(-1, 1, random), 2, 98);
        const landingY = clamp(target.y + randomBetween(-1, 1, random), 2, 98);

        frameEvents.push(
          createMatchEvent({
            id: nextEventId(),
            tick,
            minute,
            type: "pass",
            teamId: possessionTeam.team.id,
            x: carrier.x,
            y: carrier.y,
            endX: landingX,
            endY: landingY,
            playerId: carrier.base.id,
            targetPlayerId: target.base.id,
            outcome: "success",
            description: `${minuteLabel(minute)} Pass: ${carrier.base.name} to ${target.base.name}.`
          })
        );

        ball.x = landingX;
        ball.y = landingY;
        target.x = landingX;
        target.y = landingY;
        ball.carrierPlayerId = target.base.id;
        ball.teamId = possessionTeam.team.id;

        markContribution(contributions, carrier.base.id, 0.16);
        markContribution(contributions, target.base.id, 0.1);
      } else {
        const intercepted = random() < 0.72;
        if (intercepted) {
          const interceptor = closestOpponent(target, defendingTeam.players);

          frameEvents.push(
            createMatchEvent({
              id: nextEventId(),
              tick,
              minute,
              type: "interception",
              teamId: defendingTeam.team.id,
              x: target.x,
              y: target.y,
              playerId: interceptor.base.id,
              targetPlayerId: carrier.base.id,
              outcome: "success",
              description: `${minuteLabel(minute)} Interception: ${interceptor.base.name} cuts out the pass.`
            })
          );

          defendingStats.interceptions += 1;
          possessionTeamId = defendingTeam.team.id;
          ball.teamId = defendingTeam.team.id;
          ball.x = interceptor.x;
          ball.y = interceptor.y;
          ball.carrierPlayerId = interceptor.base.id;

          markContribution(contributions, interceptor.base.id, 0.22);
        } else {
          const recoverer = closestOpponent(carrier, defendingTeam.players);

          frameEvents.push(
            createMatchEvent({
              id: nextEventId(),
              tick,
              minute,
              type: "interception",
              teamId: defendingTeam.team.id,
              x: carrier.x,
              y: carrier.y,
              playerId: recoverer.base.id,
              targetPlayerId: carrier.base.id,
              outcome: "success",
              description: `${minuteLabel(minute)} Turnover: ${recoverer.base.name} wins a loose ball.`
            })
          );

          possessionTeamId = defendingTeam.team.id;
          ball.teamId = defendingTeam.team.id;
          ball.x = recoverer.x;
          ball.y = recoverer.y;
          ball.carrierPlayerId = recoverer.base.id;
        }
      }
    } else if (action === "dribble") {
      const marker = closestOpponent(carrier, defendingTeam.players);
      const successChance = clamp(
        estimateDribbleSuccess({
          carrier,
          marker,
          pressure: defensivePressure,
          random
        }),
        0.05,
        0.94
      );

      const success = random() < successChance;

      if (success) {
        const direction = possessionTeam.team.id === home.team.id ? 1 : -1;
        const stride = 1.6 + effectiveAttribute(carrier.base, "speed", carrier.stamina) * 2.4;
        const targetX = clamp(carrier.x + stride * direction, 2, 98);
        const targetY = clamp(carrier.y + randomBetween(-4, 4, random), 4, 96);

        moveTowards(carrier, targetX, targetY, stride);

        ball.x = carrier.x;
        ball.y = carrier.y;
        ball.teamId = possessionTeam.team.id;
        ball.carrierPlayerId = carrier.base.id;

        frameEvents.push(
          createMatchEvent({
            id: nextEventId(),
            tick,
            minute,
            type: "dribble",
            teamId: possessionTeam.team.id,
            x: carrier.x,
            y: carrier.y,
            endX: targetX,
            endY: targetY,
            playerId: carrier.base.id,
            outcome: "success",
            description: `${minuteLabel(minute)} Dribble: ${carrier.base.name} drives forward.`
          })
        );

        markContribution(contributions, carrier.base.id, 0.24);
      } else {
        const duelRoll = random();

        if (duelRoll < 0.58) {
          defendingStats.tackles += 1;
          possessionTeamId = defendingTeam.team.id;

          ball.teamId = defendingTeam.team.id;
          ball.x = marker.x;
          ball.y = marker.y;
          ball.carrierPlayerId = marker.base.id;

          frameEvents.push(
            createMatchEvent({
              id: nextEventId(),
              tick,
              minute,
              type: "tackle",
              teamId: defendingTeam.team.id,
              x: marker.x,
              y: marker.y,
              playerId: marker.base.id,
              targetPlayerId: carrier.base.id,
              outcome: "success",
              description: `${minuteLabel(minute)} Tackle: ${marker.base.name} stops ${carrier.base.name}.`
            })
          );

          markContribution(contributions, marker.base.id, 0.34);
        } else if (duelRoll < 0.74) {
          defendingStats.fouls += 1;

          frameEvents.push(
            createMatchEvent({
              id: nextEventId(),
              tick,
              minute,
              type: "foul",
              teamId: defendingTeam.team.id,
              x: carrier.x,
              y: carrier.y,
              playerId: marker.base.id,
              targetPlayerId: carrier.base.id,
              outcome: "failed",
              description: `${minuteLabel(minute)} Foul: ${marker.base.name} brings down ${carrier.base.name}.`
            })
          );

          frameEvents.push(
            createMatchEvent({
              id: nextEventId(),
              tick,
              minute,
              type: "free_kick",
              teamId: possessionTeam.team.id,
              x: carrier.x,
              y: carrier.y,
              playerId: carrier.base.id,
              outcome: "neutral",
              description: `${minuteLabel(minute)} Free Kick: ${possessionTeam.team.shortName} prepare a set piece.`
            })
          );

          ball.teamId = possessionTeam.team.id;
          ball.carrierPlayerId = carrier.base.id;
          ball.x = carrier.x;
          ball.y = carrier.y;
        } else {
          defendingStats.interceptions += 1;
          possessionTeamId = defendingTeam.team.id;

          const interceptor = closestOpponent(carrier, defendingTeam.players);

          ball.teamId = defendingTeam.team.id;
          ball.carrierPlayerId = interceptor.base.id;
          ball.x = interceptor.x;
          ball.y = interceptor.y;

          frameEvents.push(
            createMatchEvent({
              id: nextEventId(),
              tick,
              minute,
              type: "interception",
              teamId: defendingTeam.team.id,
              x: interceptor.x,
              y: interceptor.y,
              playerId: interceptor.base.id,
              targetPlayerId: carrier.base.id,
              outcome: "success",
              description: `${minuteLabel(minute)} Interception: ${interceptor.base.name} steals the ball.`
            })
          );

          markContribution(contributions, interceptor.base.id, 0.27);
        }
      }
    } else if (action === "shot") {
      const shotModel = estimateShotModel({
        carrier,
        team: possessionTeam.team,
        pressure: defensivePressure,
        x: carrier.x,
        y: carrier.y,
        homeTeamId: home.team.id
      });

      attackingStats.shots += 1;
      attackingStats.xg += shotModel.xg;

      const onTarget = random() < shotModel.onTargetChance;

      frameEvents.push(
        createMatchEvent({
          id: nextEventId(),
          tick,
          minute,
          type: "shot",
          teamId: possessionTeam.team.id,
          x: carrier.x,
          y: carrier.y,
          endX: possessionTeam.team.id === home.team.id ? 100 : 0,
          endY: clamp(50 + randomBetween(-8, 8, random), 14, 86),
          playerId: carrier.base.id,
          outcome: onTarget ? "success" : "failed",
          xgDelta: shotModel.xg,
          description: `${minuteLabel(minute)} Shot: ${carrier.base.name} lets one fly.`
        })
      );

      if (onTarget) {
        attackingStats.shotsOnTarget += 1;

        const keeper = pickGoalkeeper(defendingTeam);
        const keeperShotStopping =
          effectiveAttribute(keeper.base, "defending", keeper.stamina) * 0.64 +
          effectiveAttribute(keeper.base, "physical", keeper.stamina) * 0.36;
        const finalGoalChance = clamp(shotModel.goalChance * (1 - keeperShotStopping * 0.38), 0.02, 0.82);

        if (random() < finalGoalChance) {
          const scoringTeamStats = getStatBlock(possessionTeam.team.id);
          scoringTeamStats.goals += 1;

          if (possessionTeam.team.id === home.team.id) {
            score.home += 1;
          } else {
            score.away += 1;
          }

          frameEvents.push(
            createMatchEvent({
              id: nextEventId(),
              tick,
              minute,
              type: "goal",
              teamId: possessionTeam.team.id,
              x: carrier.x,
              y: carrier.y,
              playerId: carrier.base.id,
              outcome: "success",
              xgDelta: shotModel.xg,
              description: `${minuteLabel(minute)} Goal: ${carrier.base.name} scores for ${possessionTeam.team.shortName}!`
            })
          );

          markContribution(contributions, carrier.base.id, 5);

          possessionTeamId = defendingTeam.team.id;
          const restartCarrier = pickKickoffCarrier(defendingTeam);
          placeForKickoff(home, away);

          restartCarrier.x = 50;
          restartCarrier.y = 50;

          ball.teamId = defendingTeam.team.id;
          ball.carrierPlayerId = restartCarrier.base.id;
          ball.x = 50;
          ball.y = 50;
        } else {
          frameEvents.push(
            createMatchEvent({
              id: nextEventId(),
              tick,
              minute,
              type: "save",
              teamId: defendingTeam.team.id,
              x: keeper.x,
              y: keeper.y,
              playerId: keeper.base.id,
              targetPlayerId: carrier.base.id,
              outcome: "success",
              description: `${minuteLabel(minute)} Save: ${keeper.base.name} denies ${carrier.base.name}.`
            })
          );

          markContribution(contributions, keeper.base.id, 1.4);

          const toCorner = random() < 0.28;
          if (toCorner) {
            attackingStats.corners += 1;
            const cornerY = carrier.y < 50 ? 6 : 94;
            const cornerX = possessionTeam.team.id === home.team.id ? 99 : 1;
            const cornerTaker = selectPassTarget({
              carrier,
              team: possessionTeam.team,
              teammates: possessionTeam.players,
              opponents: defendingTeam.players,
              isBackpass: false,
              homeTeamId: home.team.id,
              random
            });

            cornerTaker.x = cornerX;
            cornerTaker.y = cornerY;

            frameEvents.push(
              createMatchEvent({
                id: nextEventId(),
                tick,
                minute,
                type: "corner",
                teamId: possessionTeam.team.id,
                x: cornerX,
                y: cornerY,
                playerId: cornerTaker.base.id,
                outcome: "neutral",
                description: `${minuteLabel(minute)} Corner: ${possessionTeam.team.shortName} win a corner.`
              })
            );

            ball.teamId = possessionTeam.team.id;
            ball.carrierPlayerId = cornerTaker.base.id;
            ball.x = cornerX;
            ball.y = cornerY;
          } else {
            possessionTeamId = defendingTeam.team.id;
            ball.teamId = defendingTeam.team.id;
            ball.carrierPlayerId = keeper.base.id;
            ball.x = keeper.x;
            ball.y = keeper.y;
          }
        }
      } else {
        const cornerChance = random() < 0.09;
        if (cornerChance) {
          attackingStats.corners += 1;
          const cornerY = carrier.y < 50 ? 6 : 94;
          const cornerX = possessionTeam.team.id === home.team.id ? 99 : 1;
          frameEvents.push(
            createMatchEvent({
              id: nextEventId(),
              tick,
              minute,
              type: "corner",
              teamId: possessionTeam.team.id,
              x: cornerX,
              y: cornerY,
              playerId: carrier.base.id,
              outcome: "neutral",
              description: `${minuteLabel(minute)} Corner: Deflection behind for a corner.`
            })
          );

          ball.teamId = possessionTeam.team.id;
          ball.carrierPlayerId = carrier.base.id;
          ball.x = cornerX;
          ball.y = cornerY;
        } else {
          const keeper = pickGoalkeeper(defendingTeam);
          possessionTeamId = defendingTeam.team.id;
          ball.teamId = defendingTeam.team.id;
          ball.carrierPlayerId = keeper.base.id;
          ball.x = keeper.x;
          ball.y = keeper.y;

          frameEvents.push(
            createMatchEvent({
              id: nextEventId(),
              tick,
              minute,
              type: "interception",
              teamId: defendingTeam.team.id,
              x: keeper.x,
              y: keeper.y,
              playerId: keeper.base.id,
              outcome: "success",
              description: `${minuteLabel(minute)} Goal kick claimed by ${keeper.base.name}.`
            })
          );
        }
      }
    } else {
      const marker = closestOpponent(carrier, defendingTeam.players);
      const foulRisk = random();

      if (foulRisk < 0.24) {
        defendingStats.fouls += 1;

        frameEvents.push(
          createMatchEvent({
            id: nextEventId(),
            tick,
            minute,
            type: "foul",
            teamId: defendingTeam.team.id,
            x: carrier.x,
            y: carrier.y,
            playerId: marker.base.id,
            targetPlayerId: carrier.base.id,
            outcome: "failed",
            description: `${minuteLabel(minute)} Foul: ${marker.base.name} clips ${carrier.base.name}.`
          })
        );

        frameEvents.push(
          createMatchEvent({
            id: nextEventId(),
            tick,
            minute,
            type: "free_kick",
            teamId: possessionTeam.team.id,
            x: carrier.x,
            y: carrier.y,
            playerId: carrier.base.id,
            outcome: "neutral",
            description: `${minuteLabel(minute)} Free Kick awarded to ${possessionTeam.team.shortName}.`
          })
        );

        ball.teamId = possessionTeam.team.id;
        ball.carrierPlayerId = carrier.base.id;
      } else if (foulRisk < 0.62) {
        defendingStats.tackles += 1;
        possessionTeamId = defendingTeam.team.id;
        ball.teamId = defendingTeam.team.id;
        ball.carrierPlayerId = marker.base.id;
        ball.x = marker.x;
        ball.y = marker.y;

        frameEvents.push(
          createMatchEvent({
            id: nextEventId(),
            tick,
            minute,
            type: "tackle",
            teamId: defendingTeam.team.id,
            x: marker.x,
            y: marker.y,
            playerId: marker.base.id,
            targetPlayerId: carrier.base.id,
            outcome: "success",
            description: `${minuteLabel(minute)} Tackle: ${marker.base.name} recovers possession.`
          })
        );

        markContribution(contributions, marker.base.id, 0.32);
      } else {
        defendingStats.interceptions += 1;
        possessionTeamId = defendingTeam.team.id;
        ball.teamId = defendingTeam.team.id;
        ball.carrierPlayerId = marker.base.id;
        ball.x = marker.x;
        ball.y = marker.y;

        frameEvents.push(
          createMatchEvent({
            id: nextEventId(),
            tick,
            minute,
            type: "interception",
            teamId: defendingTeam.team.id,
            x: marker.x,
            y: marker.y,
            playerId: marker.base.id,
            targetPlayerId: carrier.base.id,
            outcome: "success",
            description: `${minuteLabel(minute)} Interception: ${marker.base.name} takes over.`
          })
        );
      }
    }

    for (const event of frameEvents) {
      events.push(event);
    }

    if (tick === totalTicks / 2) {
      events.push(
        createMatchEvent({
          id: nextEventId(),
          tick,
          minute,
          type: "halftime",
          teamId: possessionTeamId,
          x: ball.x,
          y: ball.y,
          outcome: "neutral",
          description: `${minuteLabel(minute)} Halftime whistle.`
        })
      );
    }

    if (tick === totalTicks) {
      events.push(
        createMatchEvent({
          id: nextEventId(),
          tick,
          minute: durationMinutes,
          type: "fulltime",
          teamId: possessionTeamId,
          x: ball.x,
          y: ball.y,
          outcome: "neutral",
          description: `${durationMinutes}' Fulltime.`
        })
      );
    }

    for (const team of runtimeTeams) {
      for (const player of team.players) {
        clampOnPitch(player);
      }
    }

    const lastEventId = events[events.length - 1]?.id;
    frames.push(createFrame(tick, minute, second, elapsedSeconds, runtimeTeams, { ...score }, { ...ball }, lastEventId));
    statsByTick.push(cloneStats(stats));
  }

  const allPlayers = [...home.team.players, ...away.team.players];
  const mvpPlayerId = pickMvp(allPlayers, contributions, events);

  return {
    id: `${home.team.id}-vs-${away.team.id}-${Date.now()}`,
    mode: "simulated",
    homeTeam,
    awayTeam,
    ticksPerMatch: totalTicks,
    secondsPerTick,
    events,
    frames,
    statsByTick,
    stats,
    finalScore: score,
    mvpPlayerId
  };
};
