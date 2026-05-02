function read(name: string) {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : undefined;
}

export const appEnv = {
  supabaseUrl: read("SUPABASE_URL") ?? read("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: read("SUPABASE_ANON_KEY") ?? read("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  supabaseServiceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY"),
  upstashRedisRestUrl: read("UPSTASH_REDIS_REST_URL"),
  upstashRedisRestToken: read("UPSTASH_REDIS_REST_TOKEN"),
  qstashUrl: read("QSTASH_URL"),
  qstashToken: read("QSTASH_TOKEN"),
  qstashCurrentSigningKey: read("QSTASH_CURRENT_SIGNING_KEY"),
  qstashNextSigningKey: read("QSTASH_NEXT_SIGNING_KEY"),
  pinataJwt: read("PINATA_JWT"),
  arbitrumSepoliaRpcUrl:
    read("NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL") ??
    read("NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC") ??
    "https://sepolia-rollup.arbitrum.io/rpc",
  escrowContractAddress: read("NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS"),
  settlementTokenAddress: read("NEXT_PUBLIC_USDC_ADDRESS"),
  custodyEncryptionKey: read("TRADELOCK_CUSTODY_ENCRYPTION_KEY"),
  poolPrivateKey: read("TRADELOCK_POOL_PRIVATE_KEY"),
  automationToken: read("TRADELOCK_AUTOMATION_TOKEN"),
  publicAppUrl:
    read("TRADELOCK_PUBLIC_APP_URL") ??
    read("NEXT_PUBLIC_APP_URL") ??
    (read("VERCEL_PROJECT_PRODUCTION_URL") ? `https://${read("VERCEL_PROJECT_PRODUCTION_URL")}` : undefined) ??
    (read("VERCEL_URL") ? `https://${read("VERCEL_URL")}` : undefined),
};

export function hasSupabaseConfig() {
  return Boolean(appEnv.supabaseUrl && (appEnv.supabaseServiceRoleKey || appEnv.supabaseAnonKey));
}

export function hasRedisConfig() {
  return Boolean(appEnv.upstashRedisRestUrl && appEnv.upstashRedisRestToken);
}

export function hasQStashConfig() {
  return Boolean(appEnv.qstashToken && appEnv.qstashCurrentSigningKey && appEnv.qstashNextSigningKey);
}

export function hasPinataConfig() {
  return Boolean(appEnv.pinataJwt);
}

export function hasCustodyConfig() {
  return Boolean(appEnv.custodyEncryptionKey && appEnv.poolPrivateKey);
}
