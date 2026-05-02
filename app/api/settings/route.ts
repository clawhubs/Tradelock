import { NextRequest, NextResponse } from "next/server";

import { listSettings, updateSettings } from "@/lib/tradelock-backend";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await listSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const settings = await updateSettings(payload as never);
  return NextResponse.json({ settings });
}
