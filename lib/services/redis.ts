import { Redis } from "@upstash/redis";

import { appEnv, hasRedisConfig } from "@/lib/env";

let redisClient: Redis | null | undefined;

export function getRedisClient() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  if (!hasRedisConfig()) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({
    url: appEnv.upstashRedisRestUrl!,
    token: appEnv.upstashRedisRestToken!,
  });

  return redisClient;
}
