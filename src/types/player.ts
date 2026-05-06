export type PlayerPosition = "GK" | "DF" | "MF" | "FW";

export type PlayerRating = {
  id: string;
  externalId?: string;
  name: string;
  teamId: string;
  teamName: string;
  position: PlayerPosition;
  age?: number;
  nationality?: string;
  number?: number;
  x: number;
  y: number;
  speed: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  stamina: number;
  form: number;
  goalkeeper?: number;
  rawStats?: Record<string, unknown>;
};
