export type MatchMode = "simulated" | "replay";

export type MatchEventType =
  | "kickoff"
  | "pass"
  | "carry"
  | "dribble"
  | "shot"
  | "goal"
  | "save"
  | "tackle"
  | "interception"
  | "foul"
  | "corner"
  | "free_kick"
  | "yellow_card"
  | "red_card"
  | "substitution"
  | "halftime"
  | "fulltime";

export type PitchPoint = {
  x: number;
  y: number;
};

export type MatchEvent = {
  id: string;
  mode: MatchMode;
  tick?: number;
  minute: number;
  second: number;
  type: MatchEventType;
  teamId?: string;
  playerId?: string;
  playerName?: string;
  receiverId?: string;
  receiverName?: string;
  start?: PitchPoint;
  end?: PitchPoint;
  outcome?: string;
  xg?: number;
  description: string;
  raw?: unknown;
};
