import "server-only";

import { buildRatingsFromStats } from "@/engine/ratingBuilder";
import { isFresh, readCache, writeCache } from "@/providers/cache/fileCache";
import type {
  FixtureSummary,
  FootballDataProvider,
  Lineup,
  ProviderResponse,
  ProviderStatus,
  RawPlayerStats
} from "@/types/dataProvider";
import type { PlayerRating, PlayerPosition } from "@/types/player";
import type { Team, TacticStyle } from "@/types/team";

const API_BASE_URL = "https://v3.football.api-sports.io";
const ONE_HOUR = 1000 * 60 * 60;
const ONE_DAY = ONE_HOUR * 24;

type ApiFootballEnvelope<T> = {
  get: string;
  parameters: Record<string, string>;
  errors: unknown;
  results: number;
  paging?: {
    current: number;
    total: number;
  };
  response: T;
};

const providerLabel = "API-Football";

const missingKeyStatus: ProviderStatus = {
  id: "api-football",
  label: providerLabel,
  state: "missing_key",
  message: "API_FOOTBALL_KEY is not configured. RealBall Sim is using local demo data."
};

const connectedStatus = (extra?: Partial<ProviderStatus>): ProviderStatus => ({
  id: "api-football",
  label: providerLabel,
  state: "connected",
  message: "API-Football is available server-side.",
  ...extra
});

const cacheStatus = (cachedAt?: string): ProviderStatus => ({
  id: "api-football",
  label: providerLabel,
  state: "cached",
  message: "Using cached API-Football data to protect the free request quota.",
  cacheHit: true,
  cachedAt
});

const mapPosition = (value: string | undefined): PlayerPosition => {
  const normalized = value?.toUpperCase() ?? "";
  if (normalized.includes("GOAL") || normalized === "G") {
    return "GK";
  }
  if (normalized.includes("DEF") || normalized === "D") {
    return "DF";
  }
  if (normalized.includes("MID") || normalized === "M") {
    return "MF";
  }
  if (normalized.includes("ATT") || normalized.includes("FOR") || normalized === "F") {
    return "FW";
  }
  return "MF";
};

const tacticForTeamIndex = (index: number): TacticStyle => {
  const styles: TacticStyle[] = ["balanced", "possession", "counter", "highPress"];
  return styles[index % styles.length];
};

const numericExternalId = (id: string): string => id.replace("api-football-team-", "").replace("api-football-fixture-", "");

const previousSeason = (season: string | undefined): string | undefined => {
  if (!season || !/^\d{4}$/.test(season)) {
    return undefined;
  }

  return String(Number(season) - 1);
};

export class ApiFootballProvider implements FootballDataProvider {
  private readonly apiKey = process.env.API_FOOTBALL_KEY;

  async getStatus(): Promise<ProviderStatus> {
    if (!this.apiKey) {
      return missingKeyStatus;
    }

    return connectedStatus();
  }

  private async request<T>(
    endpoint: string,
    params: Record<string, string | number | undefined>,
    options: { ttlMs?: number; refresh?: boolean } = {}
  ): Promise<ProviderResponse<T>> {
    if (!this.apiKey) {
      throw new Error("Missing API_FOOTBALL_KEY");
    }

    const cleanedParams = Object.fromEntries(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => [key, String(value)])
    );
    const query = new URLSearchParams(cleanedParams);
    const cacheKey = `${endpoint}_${query.toString()}`;
    const cached = await readCache<T>(cacheKey);

    if (cached && isFresh(cached) && !options.refresh) {
      return {
        data: cached.data,
        status: cacheStatus(cached.cachedAt)
      };
    }

    const response = await fetch(`${API_BASE_URL}/${endpoint}?${query.toString()}`, {
      headers: {
        "x-apisports-key": this.apiKey
      },
      next: {
        revalidate: 0
      }
    });

    if (response.status === 429) {
      if (cached) {
        return {
          data: cached.data,
          status: {
            ...cacheStatus(cached.cachedAt),
            state: "quota_exceeded",
            message: "API-Football quota was exceeded, so cached data is being used."
          }
        };
      }

      throw new Error("API-Football quota exceeded and no cache is available.");
    }

    if (!response.ok) {
      if (cached) {
        return {
          data: cached.data,
          status: {
            ...cacheStatus(cached.cachedAt),
            state: "error",
            message: `API-Football returned ${response.status}; cached data is being used.`
          }
        };
      }

      throw new Error(`API-Football request failed with status ${response.status}.`);
    }

    const envelope = (await response.json()) as ApiFootballEnvelope<T>;
    const entry = await writeCache(cacheKey, envelope.response, options.ttlMs ?? ONE_DAY);

    return {
      data: entry.data,
      status: connectedStatus({
        cachedAt: entry.cachedAt
      })
    };
  }

  async getTeams(params: { league?: string; season?: string; search?: string; refresh?: boolean } = {}): Promise<ProviderResponse<Team[]>> {
    const response = await this.request<
      Array<{
        team: {
          id: number;
          name: string;
          code?: string;
          country?: string;
        };
      }>
    >(
      "teams",
      {
        league: params.league,
        season: params.season,
        search: params.search
      },
      { ttlMs: ONE_DAY, refresh: params.refresh }
    );

    let teamRows = response.data;
    let status = response.status;
    const fallbackSeason = previousSeason(params.season);

    if (teamRows.length === 0 && params.league && fallbackSeason) {
      const fallbackResponse = await this.request<typeof response.data>(
        "teams",
        {
          league: params.league,
          season: fallbackSeason,
          search: params.search
        },
        { ttlMs: ONE_DAY, refresh: params.refresh }
      );
      teamRows = fallbackResponse.data;
      status = {
        ...fallbackResponse.status,
        message: `No teams were returned for season ${params.season}; using latest available Premier League data from ${fallbackSeason}.`
      };
    }

    return {
      data: teamRows.map((entry, index) => ({
        id: `api-football-team-${entry.team.id}`,
        externalId: String(entry.team.id),
        name: entry.team.name,
        shortName: entry.team.code || entry.team.name.slice(0, 3).toUpperCase(),
        country: entry.team.country,
        color: index % 2 === 0 ? "#36c2ff" : "#ff8a4c",
        accentColor: "#ffffff",
        tacticStyle: tacticForTeamIndex(index),
        attackBias: 0.55,
        defensiveLine: 0.58,
        pressing: 0.55,
        tempo: 0.58,
        players: [],
        dataSource: "api-football",
        dataQuality: 0.65
      })),
      status
    };
  }

  async getFixtures(params: {
    teamId?: string;
    league?: string;
    season?: string;
    from?: string;
    to?: string;
    refresh?: boolean;
  } = {}): Promise<ProviderResponse<FixtureSummary[]>> {
    const apiTeamId = params.teamId ? numericExternalId(params.teamId) : undefined;
    const response = await this.request<
      Array<{
        fixture: {
          id: number;
          date: string;
          venue?: { name?: string };
          status?: { short?: string };
        };
        league?: {
          name?: string;
          season?: number;
        };
        teams: {
          home: { id: number; name: string };
          away: { id: number; name: string };
        };
      }>
    >(
      "fixtures",
      {
        team: apiTeamId,
        league: params.league,
        season: params.season,
        from: params.from,
        to: params.to,
        next: params.league || params.season ? undefined : apiTeamId ? 10 : undefined
      },
      { ttlMs: ONE_HOUR * 6, refresh: params.refresh }
    );

    let fixtureRows = response.data;
    let status = response.status;
    const fallbackSeason = previousSeason(params.season);

    if (fixtureRows.length === 0 && params.league && fallbackSeason) {
      const fallbackResponse = await this.request<typeof response.data>(
        "fixtures",
        {
          team: apiTeamId,
          league: params.league,
          season: fallbackSeason,
          from: params.from,
          to: params.to
        },
        { ttlMs: ONE_HOUR * 6, refresh: params.refresh }
      );
      fixtureRows = fallbackResponse.data;
      status = {
        ...fallbackResponse.status,
        message: `No fixtures were returned for season ${params.season}; using latest available Premier League fixtures from ${fallbackSeason}.`
      };
    }

    return {
      data: fixtureRows.map((entry) => ({
        id: `api-football-fixture-${entry.fixture.id}`,
        externalId: String(entry.fixture.id),
        homeTeamId: `api-football-team-${entry.teams.home.id}`,
        awayTeamId: `api-football-team-${entry.teams.away.id}`,
        homeTeamName: entry.teams.home.name,
        awayTeamName: entry.teams.away.name,
        kickoff: entry.fixture.date,
        competition: entry.league?.name,
        season: entry.league?.season ? String(entry.league.season) : undefined,
        venue: entry.fixture.venue?.name,
        status: entry.fixture.status?.short === "NS" ? "scheduled" : "finished",
        raw: entry
      })),
      status
    };
  }

  async getPlayerStats(params: { teamId: string; season?: string; refresh?: boolean }): Promise<ProviderResponse<RawPlayerStats[]>> {
    const apiTeamId = numericExternalId(params.teamId);
    const season = params.season ?? String(new Date().getFullYear());
    const response = await this.request<
      Array<{
        player: {
          id: number;
          name: string;
          age?: number;
          nationality?: string;
        };
        statistics: Array<{
          team?: { id: number; name: string };
          games?: { position?: string; minutes?: number; number?: number; rating?: string; appearences?: number; lineups?: number };
          shots?: { total?: number; on?: number };
          goals?: { total?: number; assists?: number; saves?: number; conceded?: number };
          passes?: { key?: number; accuracy?: number };
          tackles?: { total?: number; interceptions?: number; blocks?: number };
          duels?: { total?: number; won?: number };
          dribbles?: { attempts?: number; success?: number };
          fouls?: { drawn?: number; committed?: number };
        }>;
      }>
    >(
      "players",
      {
        team: apiTeamId,
        season
      },
      { ttlMs: ONE_DAY, refresh: params.refresh }
    );

    return {
      data: response.data.map((entry) => {
        const stats = entry.statistics[0] ?? {};
        return {
          externalId: String(entry.player.id),
          name: entry.player.name,
          teamId: `api-football-team-${stats.team?.id ?? apiTeamId}`,
          teamName: stats.team?.name ?? "Unknown Team",
          position: mapPosition(stats.games?.position),
          age: entry.player.age,
          nationality: entry.player.nationality,
          number: stats.games?.number,
          minutes: stats.games?.minutes,
          starts: stats.games?.lineups,
          appearances: stats.games?.appearences,
          goals: stats.goals?.total,
          assists: stats.goals?.assists,
          shots: stats.shots?.total,
          shotsOnTarget: stats.shots?.on,
          keyPasses: stats.passes?.key,
          passAccuracy: stats.passes?.accuracy,
          tackles: stats.tackles?.total,
          interceptions: stats.tackles?.interceptions,
          blocks: stats.tackles?.blocks,
          duelsTotal: stats.duels?.total,
          duelsWon: stats.duels?.won,
          dribbleAttempts: stats.dribbles?.attempts,
          dribblesSucceeded: stats.dribbles?.success,
          foulsWon: stats.fouls?.drawn,
          foulsCommitted: stats.fouls?.committed,
          saves: stats.goals?.saves,
          goalsConceded: stats.goals?.conceded,
          rating: stats.games?.rating ? Number(stats.games.rating) : undefined,
          raw: entry as unknown as Record<string, unknown>
        };
      }),
      status: response.status
    };
  }

  async getSquad(params: { teamId: string; season?: string; refresh?: boolean }): Promise<ProviderResponse<PlayerRating[]>> {
    const apiTeamId = numericExternalId(params.teamId);
    const squad = await this.request<
      Array<{
        team: {
          id: number;
          name: string;
        };
        players: Array<{
          id: number;
          name: string;
          age?: number;
          number?: number;
          position?: string;
        }>;
      }>
    >(
      "players/squads",
      {
        team: apiTeamId
      },
      { ttlMs: ONE_DAY, refresh: params.refresh }
    );

    const rawSquad: RawPlayerStats[] = squad.data.flatMap((entry) =>
      entry.players.map((player) => ({
        externalId: String(player.id),
        name: player.name,
        teamId: `api-football-team-${entry.team.id}`,
        teamName: entry.team.name,
        position: mapPosition(player.position),
        age: player.age,
        number: player.number,
        raw: player as unknown as Record<string, unknown>
      }))
    );

    let ratings = buildRatingsFromStats(rawSquad);

    try {
      const stats = await this.getPlayerStats(params);
      const statsByExternalId = new Map(stats.data.map((playerStats) => [playerStats.externalId, playerStats]));
      ratings = buildRatingsFromStats(
        rawSquad.map((player) => ({
          ...player,
          ...(statsByExternalId.get(player.externalId) ?? {})
        }))
      );
    } catch {
      // The squad endpoint is enough for fallback ratings; detailed stats improve them when quota allows.
    }

    return {
      data: ratings,
      status: squad.status
    };
  }

  async getLineups(params: { fixtureId: string; refresh?: boolean }): Promise<ProviderResponse<Lineup[]>> {
    const apiFixtureId = numericExternalId(params.fixtureId);
    const response = await this.request<
      Array<{
        team: { id: number };
        formation?: string;
        startXI?: Array<{
          player: { id: number; name: string; number?: number; pos?: string };
        }>;
        substitutes?: Array<{
          player: { id: number; name: string; number?: number; pos?: string };
        }>;
      }>
    >(
      "fixtures/lineups",
      {
        fixture: apiFixtureId
      },
      { ttlMs: ONE_DAY, refresh: params.refresh }
    );

    return {
      data: response.data.map((lineup) => ({
        teamId: `api-football-team-${lineup.team.id}`,
        formation: lineup.formation,
        starters:
          lineup.startXI?.map((entry) => ({
            playerId: `api-football-player-${entry.player.id}`,
            playerName: entry.player.name,
            teamId: `api-football-team-${lineup.team.id}`,
            position: mapPosition(entry.player.pos),
            number: entry.player.number
          })) ?? [],
        bench:
          lineup.substitutes?.map((entry) => ({
            playerId: `api-football-player-${entry.player.id}`,
            playerName: entry.player.name,
            teamId: `api-football-team-${lineup.team.id}`,
            position: mapPosition(entry.player.pos),
            number: entry.player.number
          })) ?? [],
        raw: lineup
      })),
      status: response.status
    };
  }

  async getInjuries(params: { teamId?: string; fixtureId?: string; season?: string; refresh?: boolean }): Promise<ProviderResponse<unknown[]>> {
    return this.request<unknown[]>(
      "injuries",
      {
        team: params.teamId ? numericExternalId(params.teamId) : undefined,
        fixture: params.fixtureId ? numericExternalId(params.fixtureId) : undefined,
        season: params.season
      },
      { ttlMs: ONE_HOUR * 6, refresh: params.refresh }
    );
  }

  async getFixtureEvents(params: { fixtureId: string; refresh?: boolean }): Promise<ProviderResponse<unknown[]>> {
    return this.request<unknown[]>(
      "fixtures/events",
      {
        fixture: numericExternalId(params.fixtureId)
      },
      { ttlMs: ONE_DAY, refresh: params.refresh }
    );
  }

  async getStandings(params: { league: string; season: string; refresh?: boolean }): Promise<ProviderResponse<unknown[]>> {
    return this.request<unknown[]>(
      "standings",
      {
        league: params.league,
        season: params.season
      },
      { ttlMs: ONE_DAY, refresh: params.refresh }
    );
  }

  async getPredictions(params: { fixtureId: string; refresh?: boolean }): Promise<ProviderResponse<unknown[]>> {
    return this.request<unknown[]>(
      "predictions",
      {
        fixture: numericExternalId(params.fixtureId)
      },
      { ttlMs: ONE_HOUR * 12, refresh: params.refresh }
    );
  }
}

export const apiFootballProvider = new ApiFootballProvider();
