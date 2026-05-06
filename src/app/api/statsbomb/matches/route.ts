import { NextRequest, NextResponse } from "next/server";

import { getStatsBombMatches } from "@/providers/statsBombOpenDataProvider";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const competitionId = request.nextUrl.searchParams.get("competitionId");
  const seasonId = request.nextUrl.searchParams.get("seasonId");

  if (!competitionId || !seasonId) {
    return NextResponse.json({ error: "competitionId and seasonId are required" }, { status: 400 });
  }

  return NextResponse.json(await getStatsBombMatches(competitionId, seasonId));
}
