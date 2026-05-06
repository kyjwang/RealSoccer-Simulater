import { NextRequest } from "next/server";

import { getFootballParams, withApiFootballFallback } from "@/app/api/football/routeUtils";
import { apiFootballProvider } from "@/providers/apiFootballProvider";
import { localDemoProvider } from "@/providers/fallback/localDemoProvider";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = getFootballParams(request);

  return withApiFootballFallback(
    () =>
      apiFootballProvider.getFixtures({
        league: params.league,
        season: params.season,
        teamId: params.teamId,
        refresh: params.refresh
      }),
    () => localDemoProvider.getFixtures()
  );
}
