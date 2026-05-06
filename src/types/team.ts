import type { PlayerRating } from "@/types/player";

export type TacticStyle = "possession" | "balanced" | "counter" | "highPress" | "longBall";

export type Team = {
  id: string;
  externalId?: string;
  name: string;
  shortName: string;
  country?: string;
  league?: string;
  color: string;
  accentColor: string;
  tacticStyle: TacticStyle;
  attackBias: number;
  defensiveLine: number;
  pressing: number;
  tempo: number;
  players: PlayerRating[];
  dataSource?: "api-football" | "statsbomb-open-data" | "local-demo" | "manual";
  dataQuality?: number;
};
