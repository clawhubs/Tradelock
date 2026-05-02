import { NextRequest, NextResponse } from "next/server";

import { getDeal, updateDeal } from "@/lib/tradelock-backend";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const deal = await getDeal(id);

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  return NextResponse.json({ deal });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const patch = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const deal = await updateDeal(id, patch as never);

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  return NextResponse.json({ deal });
}
