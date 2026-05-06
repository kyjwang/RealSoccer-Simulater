import { NextRequest, NextResponse } from "next/server";

import { apiFootballProvider } from "@/providers/apiFootballProvider";
import { localDemoProvider } from "@/providers/fallback/localDemoProvider";

export const dynamic = "force-dynamic";

const apiOrFallback = async <T>(operation: () => Promise<T>, fallback: () => Promise<T>): Promise<T> => {
  try {
    const status = await apiFootballProvider.getStatus();
    if (status.state === "missing_key") {
      return fallback();
    }
    return await operation();
  } catch (error) {
    const fallbackResponse = await fallback();
    return {
      ...(fallbackResponse as Record<string, unknown>),
      status: {
        id: "api-football",
        label: "API-Football",
        state: "error",
        message: error instanceof Error ? `${error.message} Falling back to local demo data.` : "Unknown provider error. Falling back to local demo data."
      }
    } as T;
  }
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const resource = searchParams.get("resource") ?? "status";
  const refresh = searchParams.get("refresh") === "1";
  const teamId = searchParams.get("teamId") ?? undefined;
  const fixtureId = searchParams.get("fixtureId") ?? undefined;
  const league = searchParams.get("league") ?? undefined;
  const season = searchParams.get("season") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  if (resource === "status") {
    const apiStatus = await apiFootballProvider.getStatus();
    const demoStatus = await localDemoProvider.getStatus();
    return NextResponse.json({
      apiFootball: apiStatus,
      localDemo: demoStatus
    });
  }

  if (resource === "teams") {
    const response = await apiOrFallback(
      () => apiFootballProvider.getTeams({ league, season, refresh }),
      () => localDemoProvider.getTeams()
    );
    return NextResponse.json(response);
  }

  if (resource === "fixtures") {
    const response = await apiOrFallback(
      () => apiFootballProvider.getFixtures({ teamId, league, season, from, to, refresh }),
      () => localDemoProvider.getFixtures()
    );
    return NextResponse.json(response);
  }

  if (resource === "squad" && teamId) {
    const response = await apiOrFallback(
      () => apiFootballProvider.getSquad({ teamId, season, refresh }),
      () => localDemoProvider.getSquad({ teamId })
    );
    return NextResponse.json(response);
  }

  if (resource === "player-stats" && teamId) {
    const response = await apiOrFallback(
      () => apiFootballProvider.getPlayerStats({ teamId, season, refresh }),
      () => localDemoProvider.getPlayerStats({ teamId })
    );
    return NextResponse.json(response);
  }

  if (resource === "lineups" && fixtureId) {
    const response = await apiOrFallback(
      () => apiFootballProvider.getLineups({ fixtureId, refresh }),
      () => localDemoProvider.getLineups({ fixtureId })
    );
    return NextResponse.json(response);
  }

  if (resource === "injuries") {
    const response = await apiOrFallback(
      () => apiFootballProvider.getInjuries({ teamId, fixtureId, season, refresh }),
      async () => ({
        data: [],
        status: await localDemoProvider.getStatus()
      })
    );
    return NextResponse.json(response);
  }

  if (resource === "fixture-events" && fixtureId) {
    const response = await apiOrFallback(
      () => apiFootballProvider.getFixtureEvents({ fixtureId, refresh }),
      async () => ({
        data: [],
        status: await localDemoProvider.getStatus()
      })
    );
    return NextResponse.json(response);
  }

  if (resource === "standings" && league && season) {
    const response = await apiOrFallback(
      () => apiFootballProvider.getStandings({ league, season, refresh }),
      async () => ({
        data: [],
        status: await localDemoProvider.getStatus()
      })
    );
    return NextResponse.json(response);
  }

  if (resource === "predictions" && fixtureId) {
    const response = await apiOrFallback(
      () => apiFootballProvider.getPredictions({ fixtureId, refresh }),
      async () => ({
        data: [],
        status: await localDemoProvider.getStatus()
      })
    );
    return NextResponse.json(response);
  }

  return NextResponse.json(
    {
      error: "Unsupported football-data resource.",
      supportedResources: [
        "status",
        "teams",
        "fixtures",
        "squad",
        "player-stats",
        "lineups",
        "injuries",
        "fixture-events",
        "standings",
        "predictions"
      ]
    },
    { status: 400 }
  );
}
