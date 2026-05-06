import type { FootballDataProvider, ProviderResponse, ProviderStatus } from "@/types/dataProvider";
import type { FixtureSummary, Lineup, RawPlayerStats } from "@/types/dataProvider";
import type { PlayerRating } from "@/types/player";
import type { Team } from "@/types/team";

const makePlaceholderStatus = (label: string): ProviderStatus => ({
  id: label === "football-data.org" ? "football-data-org" : "openfootball",
  label,
  state: "fallback",
  message: `${label} adapter placeholder is wired for future lightweight fixtures/standings support.`
});

const empty = async <T>(status: ProviderStatus, data: T): Promise<ProviderResponse<T>> => ({ data, status });

export class FootballDataOrgProvider implements FootballDataProvider {
  private readonly status = makePlaceholderStatus("football-data.org");

  async getStatus(): Promise<ProviderStatus> {
    return this.status;
  }

  async getTeams(): Promise<ProviderResponse<Team[]>> {
    return empty(this.status, []);
  }

  async getFixtures(): Promise<ProviderResponse<FixtureSummary[]>> {
    return empty(this.status, []);
  }

  async getSquad(): Promise<ProviderResponse<PlayerRating[]>> {
    return empty(this.status, []);
  }

  async getPlayerStats(): Promise<ProviderResponse<RawPlayerStats[]>> {
    return empty(this.status, []);
  }

  async getLineups(): Promise<ProviderResponse<Lineup[]>> {
    return empty(this.status, []);
  }
}

export class OpenFootballProvider implements FootballDataProvider {
  private readonly status = makePlaceholderStatus("openfootball");

  async getStatus(): Promise<ProviderStatus> {
    return this.status;
  }

  async getTeams(): Promise<ProviderResponse<Team[]>> {
    return empty(this.status, []);
  }

  async getFixtures(): Promise<ProviderResponse<FixtureSummary[]>> {
    return empty(this.status, []);
  }

  async getSquad(): Promise<ProviderResponse<PlayerRating[]>> {
    return empty(this.status, []);
  }

  async getPlayerStats(): Promise<ProviderResponse<RawPlayerStats[]>> {
    return empty(this.status, []);
  }

  async getLineups(): Promise<ProviderResponse<Lineup[]>> {
    return empty(this.status, []);
  }
}
