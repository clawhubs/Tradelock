import { NextResponse } from "next/server";

import { getAppState } from "@/lib/tradelock-backend";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getAppState();
  return NextResponse.json(data);
}
