import { NextRequest, NextResponse } from "next/server";

import { getFootballParams, withApiFootballFallback } from "@/app/api/football/routeUtils";
import { apiFootballProvider } from "@/providers/apiFootballProvider";
import { localDemoProvider } from "@/providers/fallback/localDemoProvider";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = getFootballParams(request);

  if (!params.teamId) {
    return NextResponse.json({ error: "teamId is required" }, { status: 400 });
  }

  return withApiFootballFallback(
    () => apiFootballProvider.getPlayerStats({ teamId: params.teamId!, season: params.season, refresh: params.refresh }),
    () => localDemoProvider.getPlayerStats({ teamId: params.teamId! })
  );
}
