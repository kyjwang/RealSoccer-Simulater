import { teams } from "@/data/teams";
import type {
  FixtureSummary,
  FootballDataProvider,
  Lineup,
  ProviderResponse,
  ProviderStatus,
  RawPlayerStats
} from "@/types/dataProvider";
import type { PlayerRating } from "@/types/player";
import type { Team } from "@/types/team";

const fallbackStatus: ProviderStatus = {
  id: "local-demo",
  label: "Local Demo Data",
  state: "fallback",
  message: "Using bundled sample teams and player ratings. Add API_FOOTBALL_KEY for latest API-Football data."
};

const demoFixture: FixtureSummary = {
  id: "demo-fixture-001",
  homeTeamId: teams[0].id,
  awayTeamId: teams[1].id,
  homeTeamName: teams[0].name,
  awayTeamName: teams[1].name,
  kickoff: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  competition: "RealBall Demo Cup",
  season: "2025/2026",
  venue: "Local Simulator Ground",
  status: "scheduled"
};

const toRawStats = (player: PlayerRating): RawPlayerStats => ({
  externalId: player.externalId,
  name: player.name,
  teamId: player.teamId,
  teamName: player.teamName,
  position: player.position,
  number: player.number,
  goals: Math.round((player.shooting - 45) / 8),
  assists: Math.round((player.passing - 45) / 10),
  shots: Math.round((player.shooting - 30) / 3),
  shotsOnTarget: Math.round((player.shooting - 45) / 5),
  keyPasses: Math.round((player.passing - 40) / 5),
  tackles: Math.round((player.defending - 35) / 5),
  interceptions: Math.round((player.defending - 35) / 6),
  dribbleAttempts: Math.round((player.dribbling - 35) / 4),
  dribblesSucceeded: Math.round((player.dribbling - 45) / 5),
  minutes: Math.round(player.stamina * 30),
  starts: Math.round(player.stamina / 6),
  appearances: Math.round(player.stamina / 5),
  rating: player.form / 10,
  raw: player.rawStats
});

export class LocalDemoProvider implements FootballDataProvider {
  async getStatus(): Promise<ProviderStatus> {
    return fallbackStatus;
  }

  async getTeams(): Promise<ProviderResponse<Team[]>> {
    return {
      data: teams,
      status: fallbackStatus
    };
  }

  async getFixtures(): Promise<ProviderResponse<FixtureSummary[]>> {
    return {
      data: [demoFixture],
      status: fallbackStatus
    };
  }

  async getSquad(params: { teamId: string }): Promise<ProviderResponse<PlayerRating[]>> {
    const team = teams.find((candidate) => candidate.id === params.teamId);
    return {
      data: team?.players ?? [],
      status: fallbackStatus
    };
  }

  async getPlayerStats(params: { teamId: string }): Promise<ProviderResponse<RawPlayerStats[]>> {
    const team = teams.find((candidate) => candidate.id === params.teamId);
    return {
      data: team?.players.map(toRawStats) ?? [],
      status: fallbackStatus
    };
  }

  async getLineups(params: { fixtureId: string }): Promise<ProviderResponse<Lineup[]>> {
    const fixture = params.fixtureId === demoFixture.id ? demoFixture : undefined;
    const selectedTeams = fixture
      ? teams.filter((team) => team.id === fixture.homeTeamId || team.id === fixture.awayTeamId)
      : teams.slice(0, 2);

    return {
      data: selectedTeams.map((team) => ({
        teamId: team.id,
        formation: "4-3-3",
        starters: team.players.slice(0, 11).map((player) => ({
          playerId: player.id,
          playerName: player.name,
          teamId: team.id,
          position: player.position,
          number: player.number,
          x: player.x,
          y: player.y
        }))
      })),
      status: fallbackStatus
    };
  }
}

export const localDemoProvider = new LocalDemoProvider();
