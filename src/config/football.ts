export const DEFAULT_FOOTBALL_CONFIG = {
  leagueName: "Premier League",
  leagueId: "39",
  season: "2024"
};

export const SUPPORTED_LEAGUES = [
  { id: "39", name: "Premier League", country: "England" },
  { id: "140", name: "La Liga", country: "Spain" },
  { id: "135", name: "Serie A", country: "Italy" },
  { id: "78", name: "Bundesliga", country: "Germany" },
  { id: "61", name: "Ligue 1", country: "France" },
  { id: "2", name: "UEFA Champions League", country: "Europe" },
  { id: "3", name: "UEFA Europa League", country: "Europe" }
];

export const buildSupportedSeasons = (baseYear: number, count = 5): string[] =>
  Array.from({ length: Math.max(1, count) }, (_, index) => String(baseYear - index));

// Updated to include recent seasons available through API-Football
export const SUPPORTED_SEASONS = ["2025", "2024", "2023", "2022", "2021"];