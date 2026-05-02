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
};

export function hasSupabaseConfig() {
  return Boolean(appEnv.supabaseUrl && (appEnv.supabaseServiceRoleKey || appEnv.supabaseAnonKey));
}

export function hasRedisConfig() {
  return Boolean(appEnv.upstashRedisRestUrl && appEnv.upstashRedisRestToken);
}

export function hasPinataConfig() {
  return Boolean(appEnv.pinataJwt);
}

export function hasCustodyConfig() {
  return Boolean(appEnv.custodyEncryptionKey && appEnv.poolPrivateKey);
}
