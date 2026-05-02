import { NextRequest, NextResponse } from "next/server";

import { isAutomationAuthorized } from "@/lib/automation-auth";
import { getQStashScheduleDefinitions, getQStashTargetBaseUrl, listQStashSchedules, summarizeSchedule, syncQStashSchedules } from "@/lib/services/qstash";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await isAutomationAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetBaseUrl = getQStashTargetBaseUrl(request.nextUrl.origin);
  const schedules = await listQStashSchedules();

  return NextResponse.json({
    targetBaseUrl,
    definitions: getQStashScheduleDefinitions(),
    schedules: schedules.map(summarizeSchedule),
  });
}

export async function POST(request: NextRequest) {
  if (!(await isAutomationAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetBaseUrl = getQStashTargetBaseUrl(request.nextUrl.origin);
  if (!targetBaseUrl) {
    return NextResponse.json({ error: "Public app URL is not configured." }, { status: 400 });
  }

  const synced = await syncQStashSchedules(targetBaseUrl);
  return NextResponse.json({
    targetBaseUrl,
    synced,
  });
}
