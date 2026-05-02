import { Client, type CreateScheduleRequest, type Schedule } from "@upstash/qstash";

import { appEnv, hasQStashConfig } from "@/lib/env";

export type QStashScheduleDefinition = {
  scheduleId: string;
  label: string;
  cron: string;
  path: string;
  description: string;
};

const scheduleDefinitions: QStashScheduleDefinition[] = [
  {
    scheduleId: "tradelock-activity-v1",
    label: "tradelock-activity",
    cron: "*/5 * * * *",
    path: "/api/cron/activity",
    description: "Runs the live escrow activity cycle every 5 minutes.",
  },
  {
    scheduleId: "tradelock-daily-user-v1",
    label: "tradelock-daily-user",
    cron: "5 0 * * *",
    path: "/api/cron/daily-user",
    description: "Adds one new managed user per day after the configured start date.",
  },
];

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getQStashClient() {
  if (!appEnv.qstashToken) {
    return null;
  }

  return new Client({
    token: appEnv.qstashToken,
    baseUrl: appEnv.qstashUrl,
  });
}

export function getQStashTargetBaseUrl(origin?: string) {
  const baseUrl = appEnv.publicAppUrl ?? origin;
  return baseUrl ? trimTrailingSlash(baseUrl) : undefined;
}

export function getQStashScheduleDefinitions() {
  return scheduleDefinitions;
}

function buildScheduleRequest(definition: QStashScheduleDefinition, baseUrl: string): CreateScheduleRequest {
  const destination = `${trimTrailingSlash(baseUrl)}${definition.path}`;

  return {
    destination,
    cron: definition.cron,
    method: "POST",
    scheduleId: definition.scheduleId,
    label: definition.label,
    body: JSON.stringify({
      source: "qstash",
      schedule: definition.label,
      syncedAt: new Date().toISOString(),
    }),
    headers: {
      "Content-Type": "application/json",
      ...(appEnv.automationToken ? { "x-tradelock-automation-token": appEnv.automationToken } : {}),
    },
    retries: 3,
    timeout: 60,
    redact: {
      body: true,
      header: ["x-tradelock-automation-token"],
    },
  };
}

export async function syncQStashSchedules(baseUrl: string) {
  const client = getQStashClient();
  if (!client || !hasQStashConfig()) {
    throw new Error("QStash env is incomplete.");
  }

  const results = await Promise.all(
    scheduleDefinitions.map(async (definition) => {
      const response = await client.schedules.create(buildScheduleRequest(definition, baseUrl));
      return {
        ...definition,
        destination: `${trimTrailingSlash(baseUrl)}${definition.path}`,
        scheduleId: response.scheduleId,
      };
    }),
  );

  return results;
}

export async function listQStashSchedules() {
  const client = getQStashClient();
  if (!client || !hasQStashConfig()) {
    return [];
  }

  const schedules = await client.schedules.list();
  return schedules.filter((schedule) => schedule.label?.startsWith("tradelock-"));
}

export async function getQStashHealth() {
  if (!hasQStashConfig()) {
    return { configured: false, healthy: false, detail: "QStash env is missing." };
  }

  const client = getQStashClient();
  if (!client) {
    return { configured: false, healthy: false, detail: "QStash client is unavailable." };
  }

  try {
    const schedules = await listQStashSchedules();
    const detail =
      schedules.length > 0
        ? `${schedules.length} TradeLock schedule${schedules.length === 1 ? "" : "s"} active.`
        : "QStash reachable. No TradeLock schedules found yet.";

    return { configured: true, healthy: true, detail };
  } catch (error) {
    return {
      configured: true,
      healthy: false,
      detail: error instanceof Error ? error.message : "Unknown QStash error.",
    };
  }
}

export function summarizeSchedule(schedule: Schedule) {
  return {
    scheduleId: schedule.scheduleId,
    cron: schedule.cron,
    destination: schedule.destination,
    label: schedule.label,
    method: schedule.method,
    nextScheduleTime: schedule.nextScheduleTime ?? null,
  };
}
