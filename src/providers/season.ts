export const previousSeason = (season: string | undefined): string | undefined => {
  if (!season || !/^\d{4}$/.test(season)) {
    return undefined;
  }

  return String(Number(season) - 1);
};
