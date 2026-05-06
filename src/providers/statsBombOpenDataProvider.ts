import {
  statsBombSampleCompetitions,
  statsBombSampleMatches
} from "@/data/statsbomb/sampleOpenData";
import type {
  HistoricalCompetition,
  HistoricalEventDataProvider,
  HistoricalMatch,
  ProviderResponse,
  ProviderStatus
} from "@/types/dataProvider";

const status: ProviderStatus = {
  id: "statsbomb-open-data",
  label: "StatsBomb Open Data",
  state: "fallback",
  message: "Loaded bundled StatsBomb-style sample data for offline historical replay."
};

export class StatsBombOpenDataProvider implements HistoricalEventDataProvider {
  async getCompetitions(): Promise<ProviderResponse<HistoricalCompetition[]>> {
    return {
      data: statsBombSampleCompetitions,
      status
    };
  }

  async getMatches(params: { competitionId: string; seasonId: string }): Promise<ProviderResponse<HistoricalMatch[]>> {
    return {
      data: statsBombSampleMatches.filter(
        (match) => match.competitionId === params.competitionId && match.seasonId === params.seasonId
      ),
      status
    };
  }

  async getMatch(params: { matchId: string }): Promise<ProviderResponse<HistoricalMatch>> {
    const match = statsBombSampleMatches.find((candidate) => candidate.id === params.matchId);

    if (!match) {
      throw new Error(`StatsBomb sample match ${params.matchId} was not found.`);
    }

    return {
      data: match,
      status
    };
  }

  async getFreezeFrames(params: { matchId: string }): Promise<ProviderResponse<unknown[]>> {
    const match = statsBombSampleMatches.find((candidate) => candidate.id === params.matchId);

    if (!match) {
      throw new Error(`StatsBomb sample match ${params.matchId} was not found.`);
    }

    return {
      data: [],
      status: {
        ...status,
        message: "No local 360 freeze-frame sample is bundled yet; adapter method is ready for real open-data files."
      }
    };
  }
}

export const statsBombOpenDataProvider = new StatsBombOpenDataProvider();

export const getStatsBombCompetitions = () => statsBombOpenDataProvider.getCompetitions();

export const getStatsBombMatches = (competitionId: string, seasonId: string) =>
  statsBombOpenDataProvider.getMatches({ competitionId, seasonId });

export const getStatsBombLineups = async (matchId: string) => {
  const match = await statsBombOpenDataProvider.getMatch({ matchId });
  return {
    data: match.data.lineups,
    status: match.status
  };
};

export const getStatsBombEvents = async (matchId: string) => {
  const match = await statsBombOpenDataProvider.getMatch({ matchId });
  return {
    data: match.data.events,
    status: match.status
  };
};

export const getStatsBomb360 = (matchId: string) => statsBombOpenDataProvider.getFreezeFrames({ matchId });
