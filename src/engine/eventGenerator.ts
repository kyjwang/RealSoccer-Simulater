import { clamp, distance, randomBetween } from "@/engine/probability";
import { effectiveAttribute } from "@/engine/ratingModel";
import type { RandomFn } from "@/engine/probability";
import type { MatchEvent, MatchEventType } from "@/types/event";
import type { PlayerRating } from "@/types/player";
import type { Team } from "@/types/team";

export type RuntimePlayer = {
  base: PlayerRating;
  x: number;
  y: number;
  stamina: number;
  velocityX: number;
  velocityY: number;
};

export const createMatchEvent = (params: {
  id: string;
  tick: number;
  minute: number;
  type: MatchEventType;
  teamId: string;
  x: number;
  y: number;
  endX?: number;
  endY?: number;
  playerId?: string;
  playerName?: string;
  targetPlayerId?: string;
  targetPlayerName?: string;
  outcome: "success" | "failed" | "neutral";
  xgDelta?: number;
  description: string;
}): MatchEvent => ({
  id: params.id,
  mode: "simulated",
  tick: params.tick,
  minute: params.minute,
  second: Math.floor((params.tick * 5) % 60),
  type: params.type,
  teamId: params.teamId,
  playerId: params.playerId,
  playerName: params.playerName,
  receiverId: params.targetPlayerId,
  receiverName: params.targetPlayerName,
  start: {
    x: params.x,
    y: params.y
  },
  end:
    params.endX === undefined || params.endY === undefined
      ? undefined
      : {
          x: params.endX,
          y: params.endY
        },
  outcome: params.outcome,
  xg: params.xgDelta,
  description: params.description
});

export const getDistanceToGoal = (team: Team, x: number, homeTeamId: string): number =>
  team.id === homeTeamId ? 100 - x : x;

const playerDistance = (a: RuntimePlayer, b: RuntimePlayer): number => distance(a.x, a.y, b.x, b.y);

export const closestOpponent = (carrier: RuntimePlayer, opponents: RuntimePlayer[]): RuntimePlayer =>
  opponents.reduce((best, current) =>
    playerDistance(carrier, current) < playerDistance(carrier, best) ? current : best
  );

export const getDefensivePressure = (
  carrier: RuntimePlayer,
  opponents: RuntimePlayer[],
  defensiveTeam: Team
): number => {
  const nearest = closestOpponent(carrier, opponents);
  const nearestDistance = playerDistance(carrier, nearest);
  const shapeTightness = clamp(defensiveTeam.defensiveLine * 0.8 + defensiveTeam.pressing * 0.6, 0.3, 1.3);
  return clamp((1 - nearestDistance / 32) * shapeTightness, 0, 1);
};

export const getSupportScore = (
  carrier: RuntimePlayer,
  teammates: RuntimePlayer[],
  opponents: RuntimePlayer[]
): number => {
  const options = teammates.filter((player) => player.base.id !== carrier.base.id);
  if (options.length === 0) {
    return 0;
  }

  let score = 0;
  for (const teammate of options) {
    const nearestOpponentDistance = opponents.reduce((best, opponent) => {
      const d = distance(teammate.x, teammate.y, opponent.x, opponent.y);
      return Math.min(best, d);
    }, Number.POSITIVE_INFINITY);
    const passingLaneDistance = distance(carrier.x, carrier.y, teammate.x, teammate.y);
    score += clamp(nearestOpponentDistance / 24, 0, 1) * clamp(1 - passingLaneDistance / 70, 0, 1);
  }

  return clamp(score / options.length, 0, 1);
};

const targetBias = (
  target: RuntimePlayer,
  team: Team,
  carrierX: number,
  isBackpass: boolean,
  homeTeamId: string
): number => {
  const attacksRight = team.id === homeTeamId;
  const directionDelta = attacksRight ? target.x - carrierX : carrierX - target.x;

  if (isBackpass) {
    return directionDelta < 0 ? 1 : 0.45;
  }

  return directionDelta >= -2 ? 1 : 0.5;
};

export const selectPassTarget = (params: {
  carrier: RuntimePlayer;
  team: Team;
  teammates: RuntimePlayer[];
  opponents: RuntimePlayer[];
  isBackpass: boolean;
  homeTeamId: string;
  random: RandomFn;
}): RuntimePlayer => {
  const candidates = params.teammates.filter((player) => player.base.id !== params.carrier.base.id);

  if (candidates.length === 0) {
    return params.carrier;
  }

  const scored = candidates.map((target) => {
    const laneDistance = distance(params.carrier.x, params.carrier.y, target.x, target.y);
    const nearestOpponent = params.opponents.reduce((best, opponent) => {
      const d = distance(target.x, target.y, opponent.x, opponent.y);
      return Math.min(best, d);
    }, Number.POSITIVE_INFINITY);

    const openness = clamp(nearestOpponent / 25, 0, 1);
    const rangeSuitability = clamp(1 - Math.abs(laneDistance - 20) / 35, 0, 1);
    const tacticalBias = targetBias(
      target,
      params.team,
      params.carrier.x,
      params.isBackpass,
      params.homeTeamId
    );

    return {
      target,
      score: openness * 0.5 + rangeSuitability * 0.3 + tacticalBias * 0.2
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const topOptions = scored.slice(0, Math.min(3, scored.length));
  const idx = Math.floor(params.random() * topOptions.length);
  return topOptions[idx].target;
};

export const estimatePassSuccess = (params: {
  carrier: RuntimePlayer;
  target: RuntimePlayer;
  pressure: number;
  random: RandomFn;
}): number => {
  const passing = effectiveAttribute(params.carrier.base, "passing", params.carrier.stamina);
  const distanceFactor = clamp(1 - distance(params.carrier.x, params.carrier.y, params.target.x, params.target.y) / 75, 0.2, 1);
  const pressurePenalty = 1 - params.pressure * 0.35;
  const randomness = randomBetween(0.92, 1.08, params.random);

  return clamp(passing * distanceFactor * pressurePenalty * randomness, 0.08, 0.97);
};

export const estimateDribbleSuccess = (params: {
  carrier: RuntimePlayer;
  marker: RuntimePlayer;
  pressure: number;
  random: RandomFn;
}): number => {
  const dribble = effectiveAttribute(params.carrier.base, "dribbling", params.carrier.stamina);
  const speed = effectiveAttribute(params.carrier.base, "speed", params.carrier.stamina);
  const defending = effectiveAttribute(params.marker.base, "defending", params.marker.stamina);
  const physical = effectiveAttribute(params.marker.base, "physical", params.marker.stamina);

  const duel = dribble * 0.55 + speed * 0.45 - (defending * 0.6 + physical * 0.4) * 0.72;
  const pressurePenalty = 1 - params.pressure * 0.3;
  const randomness = randomBetween(0.9, 1.1, params.random);

  return clamp(0.48 + duel * 0.6, 0.09, 0.92) * pressurePenalty * randomness;
};

export const estimateShotModel = (params: {
  carrier: RuntimePlayer;
  team: Team;
  pressure: number;
  x: number;
  y: number;
  homeTeamId: string;
}): {
  xg: number;
  onTargetChance: number;
  goalChance: number;
} => {
  const shooting = effectiveAttribute(params.carrier.base, "shooting", params.carrier.stamina);
  const distanceToGoal = getDistanceToGoal(params.team, params.x, params.homeTeamId);
  const centrality = clamp(1 - Math.abs(params.y - 50) / 42, 0.2, 1);
  const boxProximity = clamp(1 - distanceToGoal / 33, 0, 1);

  const xg = clamp(0.015 + boxProximity * 0.34 + centrality * 0.1 + shooting * 0.14 - params.pressure * 0.16, 0.01, 0.6);
  const onTargetChance = clamp(0.2 + shooting * 0.54 + boxProximity * 0.12 - params.pressure * 0.2, 0.08, 0.95);
  const goalChance = clamp(xg * (0.85 + shooting * 0.4), 0.02, 0.88);

  return { xg, onTargetChance, goalChance };
};

export const minuteLabel = (minute: number): string => `${minute}'`;
