import { NextRequest, NextResponse } from "next/server";

import { isAutomationAuthorized } from "@/lib/automation-auth";
import { runDailyUserCycle } from "@/lib/custodial-engine";

export const dynamic = "force-dynamic";

async function handle(request: NextRequest) {
  if (!(await isAutomationAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDailyUserCycle();
  return NextResponse.json({ result });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
