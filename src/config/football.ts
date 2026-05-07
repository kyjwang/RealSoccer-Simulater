export const DEFAULT_FOOTBALL_CONFIG = {
  leagueName: "Premier League",
  leagueId: "39",
  season: "2026"
};

export const SUPPORTED_LEAGUES = [
  {
    id: "39",
    name: "Premier League",
    country: "England"
  }
];

export const buildSupportedSeasons = (baseYear: number, count = 5): string[] =>
  Array.from({ length: Math.max(1, count) }, (_, index) => String(baseYear - index));

const CURRENT_YEAR = new Date().getFullYear();
export const SUPPORTED_SEASONS = buildSupportedSeasons(CURRENT_YEAR, 5);
