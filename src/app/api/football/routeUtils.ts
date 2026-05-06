import { NextRequest, NextResponse } from "next/server";

import { DEFAULT_FOOTBALL_CONFIG } from "@/config/football";
import { apiFootballProvider } from "@/providers/apiFootballProvider";
import { localDemoProvider } from "@/providers/fallback/localDemoProvider";
import type { ProviderResponse } from "@/types/dataProvider";

type ApiOperation<T> = () => Promise<ProviderResponse<T>>;
type FallbackOperation<T> = () => Promise<ProviderResponse<T>>;

export const getFootballParams = (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;

  return {
    league: searchParams.get("league") ?? DEFAULT_FOOTBALL_CONFIG.leagueId,
    season: searchParams.get("season") ?? DEFAULT_FOOTBALL_CONFIG.season,
    teamId: searchParams.get("teamId") ?? undefined,
    fixtureId: searchParams.get("fixtureId") ?? undefined,
    refresh: searchParams.get("refresh") === "1"
  };
};

export const withApiFootballFallback = async <T>(
  operation: ApiOperation<T>,
  fallback: FallbackOperation<T>
): Promise<NextResponse> => {
  try {
    const status = await apiFootballProvider.getStatus();
    if (status.state === "missing_key") {
      const fallbackResponse = await fallback();
      return NextResponse.json({
        ...fallbackResponse,
        status
      });
    }

    return NextResponse.json(await operation());
  } catch (error) {
    const fallbackResponse = await fallback();
    return NextResponse.json({
      ...fallbackResponse,
      status: {
        id: "api-football",
        label: "API-Football",
        state: "error",
        message:
          error instanceof Error
            ? `${error.message} Falling back to local demo data.`
            : "Unknown API-Football error. Falling back to local demo data."
      }
    });
  }
};

export const demoStatusResponse = async (): Promise<NextResponse> =>
  NextResponse.json({
    apiFootball: await apiFootballProvider.getStatus(),
    localDemo: await localDemoProvider.getStatus()
  });
