import { NextRequest, NextResponse } from "next/server";

import { isAutomationAuthorized } from "@/lib/automation-auth";
import { rebuildLiveWorkspaceState, runFanoutActivityCycle } from "@/lib/custodial-engine";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!(await isAutomationAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as {
    rebuild?: boolean;
    fanout?: boolean;
  };

  const rebuild = payload.rebuild ?? true;
  const fanout = payload.fanout ?? true;

  const result: Record<string, unknown> = {};

  if (rebuild) {
    result.rebuild = await rebuildLiveWorkspaceState();
  }

  if (fanout) {
    result.fanout = await runFanoutActivityCycle();
  }

  return NextResponse.json(result);
}
