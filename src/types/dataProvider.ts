import type { MatchEvent } from "@/types/event";
import type { PlayerPosition, PlayerRating } from "@/types/player";
import type { Team } from "@/types/team";

export type DataSourceId =
  | "api-football"
  | "statsbomb-open-data"
  | "football-data-org"
  | "openfootball"
  | "local-demo";

export type ProviderConnectionState =
  | "connected"
  | "missing_key"
  | "quota_exceeded"
  | "cached"
  | "fallback"
  | "error";

export type ProviderStatus = {
  id: DataSourceId;
  label: string;
  state: ProviderConnectionState;
  message: string;
  cacheHit?: boolean;
  cachedAt?: string;
  quotaRemaining?: number;
};

export type ProviderResponse<T> = {
  data: T;
  status: ProviderStatus;
};

export type FixtureSummary = {
  id: string;
  externalId?: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoff: string;
  competition?: string;
  season?: string;
  venue?: string;
  status?: "scheduled" | "live" | "finished";
  raw?: unknown;
};

export type RawPlayerStats = {
  externalId?: string;
  name: string;
  teamId: string;
  teamName: string;
  position?: PlayerPosition | string;
  age?: number;
  nationality?: string;
  number?: number;
  minutes?: number;
  starts?: number;
  appearances?: number;
  goals?: number;
  assists?: number;
  shots?: number;
  shotsOnTarget?: number;
  keyPasses?: number;
  passAccuracy?: number;
  tackles?: number;
  interceptions?: number;
  clearances?: number;
  blocks?: number;
  duelsWon?: number;
  duelsTotal?: number;
  dribbleAttempts?: number;
  dribblesSucceeded?: number;
  foulsWon?: number;
  foulsCommitted?: number;
  saves?: number;
  cleanSheets?: number;
  goalsConceded?: number;
  rating?: number;
  injured?: boolean;
  raw?: Record<string, unknown>;
};

export type LineupPlayer = {
  playerId: string;
  playerName: string;
  teamId: string;
  position: PlayerPosition;
  number?: number;
  x?: number;
  y?: number;
};

export type Lineup = {
  teamId: string;
  formation?: string;
  starters: LineupPlayer[];
  bench?: LineupPlayer[];
  raw?: unknown;
};

export type HistoricalCompetition = {
  id: string;
  name: string;
  seasonId: string;
  seasonName: string;
  country?: string;
};

export type HistoricalMatch = {
  id: string;
  competitionId: string;
  seasonId: string;
  homeTeam: Team;
  awayTeam: Team;
  kickoff?: string;
  finalScore: {
    home: number;
    away: number;
  };
  lineups: Lineup[];
  events: MatchEvent[];
  raw?: unknown;
};

export interface TeamDataProvider {
  getTeams(params?: { league?: string; season?: string; search?: string; refresh?: boolean }): Promise<ProviderResponse<Team[]>>;
}

export interface PlayerDataProvider {
  getSquad(params: { teamId: string; season?: string; refresh?: boolean }): Promise<ProviderResponse<PlayerRating[]>>;
  getPlayerStats(params: { teamId: string; season?: string; refresh?: boolean }): Promise<ProviderResponse<RawPlayerStats[]>>;
}

export interface FixtureDataProvider {
  getFixtures(params?: {
    teamId?: string;
    league?: string;
    season?: string;
    from?: string;
    to?: string;
    refresh?: boolean;
  }): Promise<ProviderResponse<FixtureSummary[]>>;
  getLineups(params: { fixtureId: string; refresh?: boolean }): Promise<ProviderResponse<Lineup[]>>;
}

export interface HistoricalEventDataProvider {
  getCompetitions(): Promise<ProviderResponse<HistoricalCompetition[]>>;
  getMatches(params: { competitionId: string; seasonId: string }): Promise<ProviderResponse<HistoricalMatch[]>>;
  getMatch(params: { matchId: string }): Promise<ProviderResponse<HistoricalMatch>>;
}

export interface FootballDataProvider extends TeamDataProvider, PlayerDataProvider, FixtureDataProvider {
  getStatus(): Promise<ProviderStatus>;
}
