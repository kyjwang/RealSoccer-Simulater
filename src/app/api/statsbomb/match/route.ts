import { NextRequest, NextResponse } from "next/server";

import { statsBombOpenDataProvider } from "@/providers/statsBombOpenDataProvider";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const matchId = request.nextUrl.searchParams.get("matchId");

  if (!matchId) {
    return NextResponse.json({ error: "matchId is required" }, { status: 400 });
  }

  return NextResponse.json(await statsBombOpenDataProvider.getMatch({ matchId }));
}
