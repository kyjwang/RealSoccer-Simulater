import { pickMvp } from "@/engine/ratingModel";
import type { HistoricalMatch } from "@/types/dataProvider";
import type { MatchEvent } from "@/types/event";
import type { MatchFrame, MatchStats, MatchSummary, TeamStatBlock } from "@/types/match";
import type { PlayerRating } from "@/types/player";
import type { Team } from "@/types/team";

type ReplayPlayerState = {
  base: PlayerRating;
  x: number;
  y: number;
  stamina: number;
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

const makeRuntimePlayers = (team: Team): ReplayPlayerState[] =>
  team.players.map((player) => ({
    base: player,
    x: player.x,
    y: player.y,
    stamina: player.stamina
  }));

const findPlayer = (players: ReplayPlayerState[], playerId: string | undefined): ReplayPlayerState | undefined =>
  playerId ? players.find((player) => player.base.id === playerId) : undefined;

const sideForTeam = (match: HistoricalMatch, teamId: string | undefined): "home" | "away" | undefined => {
  if (teamId === match.homeTeam.id) {
    return "home";
  }
  if (teamId === match.awayTeam.id) {
    return "away";
  }
  return undefined;
};

const updateStats = (stats: MatchStats, match: HistoricalMatch, event: MatchEvent): void => {
  const side = sideForTeam(match, event.teamId);
  if (!side) {
    return;
  }

  const block = stats[side];
  block.possessionTicks += event.type === "halftime" || event.type === "fulltime" ? 0 : 1;

  if (event.type === "pass") {
    block.passesAttempted += 1;
    if (event.outcome === "complete" || event.outcome === "success") {
      block.passesCompleted += 1;
    }
  }

  if (event.type === "shot" || event.type === "goal" || event.type === "save") {
    block.shots += 1;
    block.xg += event.xg ?? 0.05;
    if (event.type === "goal" || event.type === "save") {
      block.shotsOnTarget += 1;
    }
  }

  if (event.type === "goal") {
    block.goals += 1;
  }

  if (event.type === "tackle") {
    block.tackles += 1;
  }
  if (event.type === "interception") {
    block.interceptions += 1;
  }
  if (event.type === "foul") {
    block.fouls += 1;
  }
  if (event.type === "corner") {
    block.corners += 1;
  }
};

const nudgePlayers = (players: ReplayPlayerState[], event: MatchEvent): void => {
  const start = event.start;
  if (!start) {
    return;
  }

  for (const player of players) {
    if (player.base.id === event.playerId || player.base.id === event.receiverId) {
      continue;
    }

    const dx = start.x - player.x;
    const dy = start.y - player.y;
    player.x += dx * 0.035;
    player.y += dy * 0.035;
  }
};

const createFrame = (params: {
  index: number;
  event: MatchEvent;
  homePlayers: ReplayPlayerState[];
  awayPlayers: ReplayPlayerState[];
  score: { home: number; away: number };
  ball: { x: number; y: number; teamId: string; carrierPlayerId?: string };
}): MatchFrame => ({
  tick: params.index,
  minute: params.event.minute,
  second: params.event.second,
  elapsedSeconds: params.event.minute * 60 + params.event.second,
  ball: { ...params.ball },
  score: { ...params.score },
  players: [...params.homePlayers, ...params.awayPlayers].map((player) => ({
    playerId: player.base.id,
    teamId: player.base.teamId,
    x: player.x,
    y: player.y,
    stamina: player.stamina,
    hasBall: params.ball.carrierPlayerId === player.base.id
  })),
  lastEventId: params.event.id
});

export const buildReplayMatch = (historicalMatch: HistoricalMatch): MatchSummary => {
  const homePlayers = makeRuntimePlayers(historicalMatch.homeTeam);
  const awayPlayers = makeRuntimePlayers(historicalMatch.awayTeam);
  const allRuntimePlayers = [...homePlayers, ...awayPlayers];
  const events = [...historicalMatch.events].sort(
    (a, b) => a.minute * 60 + a.second - (b.minute * 60 + b.second)
  );
  const stats: MatchStats = {
    home: createStatBlock(),
    away: createStatBlock()
  };
  const statsByTick: MatchStats[] = [];
  const frames: MatchFrame[] = [];
  const score = { home: 0, away: 0 };
  const contributions: Record<string, number> = {};
  const ball = {
    x: 50,
    y: 50,
    teamId: historicalMatch.homeTeam.id,
    carrierPlayerId: historicalMatch.homeTeam.players[0]?.id
  };

  for (const [index, event] of events.entries()) {
    const involvedPlayer = findPlayer(allRuntimePlayers, event.playerId);
    const receiver = findPlayer(allRuntimePlayers, event.receiverId);
    const start = event.start ?? event.end ?? { x: ball.x, y: ball.y };
    const end = event.end ?? event.start ?? start;

    if (involvedPlayer) {
      involvedPlayer.x = start.x;
      involvedPlayer.y = start.y;
    }

    if (receiver && event.end) {
      receiver.x = event.end.x;
      receiver.y = event.end.y;
    }

    nudgePlayers(allRuntimePlayers, event);

    ball.x = end.x;
    ball.y = end.y;
    if (event.teamId) {
      ball.teamId = event.teamId;
    }
    ball.carrierPlayerId = receiver?.base.id ?? involvedPlayer?.base.id ?? ball.carrierPlayerId;

    if (event.type === "goal" && event.teamId === historicalMatch.homeTeam.id) {
      score.home += 1;
      contributions[event.playerId ?? ""] = (contributions[event.playerId ?? ""] ?? 0) + 5;
    }
    if (event.type === "goal" && event.teamId === historicalMatch.awayTeam.id) {
      score.away += 1;
      contributions[event.playerId ?? ""] = (contributions[event.playerId ?? ""] ?? 0) + 5;
    }

    updateStats(stats, historicalMatch, event);
    frames.push(
      createFrame({
        index,
        event,
        homePlayers,
        awayPlayers,
        score,
        ball
      })
    );
    statsByTick.push(cloneStats(stats));
  }

  return {
    id: `replay-${historicalMatch.id}`,
    mode: "replay",
    homeTeam: historicalMatch.homeTeam,
    awayTeam: historicalMatch.awayTeam,
    ticksPerMatch: frames.length,
    secondsPerTick: 5,
    events,
    frames,
    statsByTick,
    stats,
    finalScore: historicalMatch.finalScore,
    mvpPlayerId: pickMvp([...historicalMatch.homeTeam.players, ...historicalMatch.awayTeam.players], contributions, events),
    dataQuality: {
      score: 0.72,
      label: "medium",
      warnings: [
        "Bundled replay uses event coordinates and lineups, not full broadcast tracking.",
        "360 freeze-frame rendering is represented as future adapter work."
      ]
    }
  };
};
