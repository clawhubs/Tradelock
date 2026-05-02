import { NextResponse } from "next/server";

import { listCounterparties } from "@/lib/tradelock-backend";

export const dynamic = "force-dynamic";

export async function GET() {
  const counterparties = await listCounterparties();
  return NextResponse.json({ counterparties });
}
