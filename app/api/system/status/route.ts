import { NextResponse } from "next/server";

import { getCustodialHealth } from "@/lib/custodial-engine";
import { getPersistenceStatus } from "@/lib/tradelock-backend";
import { hasRedisConfig } from "@/lib/env";
import { getPinataHealth } from "@/lib/services/pinata";
import { getRedisClient } from "@/lib/services/redis";
import { getSupabaseHealth } from "@/lib/services/supabase";

export const dynamic = "force-dynamic";

async function getRedisHealth() {
  const redis = getRedisClient();

  if (!redis || !hasRedisConfig()) {
    return { configured: false, healthy: false, detail: "Redis env is missing." };
  }

  try {
    await redis.get("tradelock:healthcheck");
    return { configured: true, healthy: true, detail: "Redis reachable." };
  } catch (error) {
    return {
      configured: true,
      healthy: false,
      detail: error instanceof Error ? error.message : "Unknown Redis error.",
    };
  }
}

export async function GET() {
  const [redis, pinata, supabase, custody] = await Promise.all([
    getRedisHealth(),
    getPinataHealth(),
    getSupabaseHealth(),
    getCustodialHealth(),
  ]);
  const persistence = await getPersistenceStatus();

  return NextResponse.json({
    services: {
      redis,
      pinata,
      supabase,
      persistence,
      custody,
    },
  });
}
