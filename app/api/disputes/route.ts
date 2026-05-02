import { NextRequest, NextResponse } from "next/server";

import { createDispute, listDisputes } from "@/lib/tradelock-backend";

export const dynamic = "force-dynamic";

export async function GET() {
  const disputes = await listDisputes();
  return NextResponse.json({ disputes });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const dispute = await createDispute(payload as never);
  return NextResponse.json({ dispute }, { status: 201 });
}
