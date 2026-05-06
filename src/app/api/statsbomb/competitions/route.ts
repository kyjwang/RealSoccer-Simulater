import { NextResponse } from "next/server";

import { getStatsBombCompetitions } from "@/providers/statsBombOpenDataProvider";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getStatsBombCompetitions());
}
