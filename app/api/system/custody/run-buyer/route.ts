import { NextRequest, NextResponse } from "next/server";

import { isAutomationAuthorized } from "@/lib/automation-auth";
import { runActivityCycleByBuyerCompany } from "@/lib/custodial-engine";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!(await isAutomationAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as {
    buyerCompany?: string;
  };

  if (!payload.buyerCompany) {
    return NextResponse.json({ error: "buyerCompany is required" }, { status: 400 });
  }

  const result = await runActivityCycleByBuyerCompany(payload.buyerCompany);
  return NextResponse.json({ result });
}
