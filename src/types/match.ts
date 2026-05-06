import type { MatchEvent } from "@/types/event";
import type { Team } from "@/types/team";

export type TeamStatBlock = {
  goals: number;
  possessionTicks: number;
  shots: number;
  shotsOnTarget: number;
  xg: number;
  passesAttempted: number;
  passesCompleted: number;
  tackles: number;
  fouls: number;
  corners: number;
  interceptions: number;
};

export type MatchStats = {
  home: TeamStatBlock;
  away: TeamStatBlock;
};

export type FramePlayerState = {
  playerId: string;
  teamId: string;
  x: number;
  y: number;
  hasBall: boolean;
  stamina: number;
};

export type MatchFrame = {
  tick: number;
  minute: number;
  second: number;
  elapsedSeconds: number;
  ball: {
    x: number;
    y: number;
    teamId: string;
    carrierPlayerId?: string;
  };
  players: FramePlayerState[];
  score: {
    home: number;
    away: number;
  };
  lastEventId?: string;
};

export type DataQuality = {
  score: number;
  label: "high" | "medium" | "low" | "demo";
  warnings: string[];
};

export type MatchSummary = {
  id: string;
  mode: "simulated" | "replay";
  homeTeam: Team;
  awayTeam: Team;
  ticksPerMatch: number;
  secondsPerTick: number;
  events: MatchEvent[];
  frames: MatchFrame[];
  statsByTick: MatchStats[];
  stats: MatchStats;
  finalScore: {
    home: number;
    away: number;
  };
  mvpPlayerId: string;
  dataQuality?: DataQuality;
};

export type ScorelineProbability = {
  scoreline: string;
  count: number;
  probability: number;
};

export type MvpCandidate = {
  playerId: string;
  playerName: string;
  teamId: string;
  count: number;
  probability: number;
};

export type PredictionResult = {
  simulationsRun: number;
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  likelyScorelines: ScorelineProbability[];
  averageGoals: {
    home: number;
    away: number;
  };
  averageXg: {
    home: number;
    away: number;
  };
  mvpCandidates: MvpCandidate[];
  dataQuality: DataQuality;
  representativeMatch: MatchSummary;
};
