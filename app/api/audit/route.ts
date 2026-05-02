import { NextRequest, NextResponse } from "next/server";

import { createAuditEvent, listAuditEvents } from "@/lib/tradelock-backend";

export const dynamic = "force-dynamic";

export async function GET() {
  const auditEvents = await listAuditEvents();
  return NextResponse.json({ auditEvents });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const auditEvent = await createAuditEvent(payload as never);
  return NextResponse.json({ auditEvent }, { status: 201 });
}
