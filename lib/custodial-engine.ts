import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";

import { createPublicClient, createWalletClient, formatEther, formatUnits, http, parseAbi, parseEther, parseUnits, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";

import { appEnv, hasCustodyConfig } from "@/lib/env";
import { getRedisClient } from "@/lib/services/redis";
import { replaceSupabaseState } from "@/lib/services/tradelock-supabase-store";
import { settlementTokenSymbol } from "@/lib/settlement-token";
import { createDefaultSettingsState, type PersistedState } from "@/lib/tradelock-default-state";
import {
  createAuditEvent,
  createDeal as createBackendDeal,
  createDispute,
  resetAppStateCache,
  updateDeal,
  updateSettings,
  upsertCounterparties,
} from "@/lib/tradelock-backend";
import type { Counterparty, SettingsState, SummaryItem } from "@/lib/types";

type ManagedRole = "Buyer" | "Seller" | "Arbitrator";
type WalletSource = "imported" | "generated";

export type BootstrapWalletInput = {
  privateKey: Hex;
  role: ManagedRole;
  company: string;
  handle: string;
  countryCode: string;
  countryName: string;
  city: string;
  trustScore?: number;
  status?: Counterparty["status"];
};

export type CustodialWalletRecord = {
  id: string;
  address: Hex;
  encryptedPrivateKey: string;
  role: ManagedRole;
  company: string;
  handle: string;
  countryCode: string;
  countryName: string;
  city: string;
  location: string;
  source: WalletSource;
  active: boolean;
  autoBuyer: boolean;
  createdAt: string;
  updatedAt: string;
  lastFundedAt?: string;
  lastActivityAt?: string;
  trustScore: number;
  counterpartyStatus: Counterparty["status"];
  funding: {
    ethTarget: string;
    ethThreshold: string;
    tusdTarget: string;
    tusdThreshold: string;
  };
  balances?: {
    eth: string;
    tusd: string;
    updatedAt: string;
  };
};

type PoolState = {
  address: Hex;
  reserveEthTarget: string;
  reserveTusdTarget: string;
  reserveTusdMintSize: string;
  updatedAt: string;
  balances?: {
    eth: string;
    tusd: string;
    updatedAt: string;
  };
};

type AutomationState = {
  targetUserCount: number;
  dailyUserStartDate: string;
  lastDailyUserDate?: string;
  activityIntervalSeconds: number;
  activityEnabled: boolean;
  dailyUserEnabled: boolean;
  nextBuyerSequence: number;
  nextSellerSequence: number;
  nextCountryCursor: number;
};

type MarketActivity = {
  id: string;
  createdAt: string;
  type: "bootstrap" | "funding" | "daily-user" | "activity" | "dispute";
  summary: string;
  dealId?: string;
  txHashes: string[];
};

export type CustodialRegistry = {
  version: 1;
  createdAt: string;
  updatedAt: string;
  wallets: CustodialWalletRecord[];
  pool: PoolState;
  automation: AutomationState;
  recentActivity: MarketActivity[];
};

export type CustodySummary = {
  totalWallets: number;
  activeWallets: number;
  buyers: number;
  activeBuyers: number;
  sellers: number;
  activeSellers: number;
  arbitrators: number;
  activeArbitrators: number;
  poolAddress: Hex;
  poolEthBalance?: string;
  poolTusdBalance?: string;
  dailyUserStartDate: string;
  lastDailyUserDate?: string;
  activityIntervalSeconds: number;
  recentActivity: MarketActivity[];
  activeWalletRows: Array<{
    id: string;
    address: Hex;
    role: ManagedRole;
    company: string;
    countryName: string;
    active: boolean;
    source: WalletSource;
    balances?: CustodialWalletRecord["balances"];
  }>;
};

type DealLifecycleResult = {
  dealId: string;
  disputeOpened: boolean;
  txHashes: string[];
};

const registryKey = "tradelock:custody:registry:v1";

const erc20Abi = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function mint(address to, uint256 value) returns (bool)",
]);

const escrowAbi = parseAbi([
  "function createDeal(string dealId, address seller, address settlementToken, uint256 amount, string metadataURI)",
  "function fundDeal(string dealId)",
  "function submitProofHash(string dealId, string proofHash)",
  "function releaseFunds(string dealId)",
  "function openDispute(string dealId, string reason)",
]);

const buyerIdentitySeeds = [
  ["Atlas Procurement House", "US", "United States", "New York"],
  ["Pacific Merchants Group", "JP", "Japan", "Osaka"],
  ["Horizon Retail Holdings", "NL", "Netherlands", "Rotterdam"],
  ["Summit Supply Markets", "IN", "India", "Mumbai"],
  ["Aurora Import Works", "AU", "Australia", "Sydney"],
  ["Meridian Trade Partners", "CA", "Canada", "Toronto"],
  ["Prime Gulf Buying Desk", "SA", "Saudi Arabia", "Riyadh"],
  ["Baltic Source Collective", "PL", "Poland", "Warsaw"],
  ["Andes Procurement Labs", "CL", "Chile", "Santiago"],
  ["Crescent Commerce Hub", "EG", "Egypt", "Cairo"],
  ["Nordic Sourcing Works", "SE", "Sweden", "Stockholm"],
  ["Iberia Buying Network", "ES", "Spain", "Madrid"],
] as const;

const sellerIdentitySeeds = [
  ["River Delta Fabrication", "VN", "Vietnam", "Ho Chi Minh City"],
  ["Anatolia Factory Group", "TR", "Turkey", "Istanbul"],
  ["Monterrey Industrial Hub", "MX", "Mexico", "Monterrey"],
  ["Java Components Works", "ID", "Indonesia", "Surabaya"],
  ["Prague Precision Supply", "CZ", "Czech Republic", "Prague"],
  ["Sao Paulo Manufacturing", "BR", "Brazil", "Sao Paulo"],
  ["Busan Metal Systems", "KR", "South Korea", "Busan"],
  ["Casablanca Export Labs", "MA", "Morocco", "Casablanca"],
  ["Budapest Assembly Works", "HU", "Hungary", "Budapest"],
  ["Penang Circuit Foundry", "MY", "Malaysia", "Penang"],
] as const;

function nowIso() {
  return new Date().toISOString();
}

function formatUsdAmount(value: number) {
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${settlementTokenSymbol}`;
}

function parseDecimal(value: string) {
  return Number.parseFloat(value);
}

function createPublicArbitrumClient() {
  return createPublicClient({
    chain: arbitrumSepolia,
    transport: http(appEnv.arbitrumSepoliaRpcUrl),
  });
}

function getPoolAccount() {
  if (!hasCustodyConfig() || !appEnv.poolPrivateKey) {
    throw new Error("Custody config is missing. Set TRADELOCK_CUSTODY_ENCRYPTION_KEY and TRADELOCK_POOL_PRIVATE_KEY.");
  }

  return privateKeyToAccount(appEnv.poolPrivateKey as Hex);
}

function createPoolWalletClient() {
  const account = getPoolAccount();
  return createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(appEnv.arbitrumSepoliaRpcUrl),
  });
}

function getRedisOrThrow() {
  const redis = getRedisClient();

  if (!redis) {
    throw new Error("Redis is required for the custodial wallet engine.");
  }

  return redis;
}

function createEncryptionKey() {
  if (!appEnv.custodyEncryptionKey) {
    throw new Error("TRADELOCK_CUSTODY_ENCRYPTION_KEY is missing.");
  }

  return createHash("sha256").update(appEnv.custodyEncryptionKey).digest();
}

function encryptPrivateKey(privateKey: Hex) {
  const iv = randomBytes(12);
  const key = createEncryptionKey();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(privateKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}.${encrypted.toString("hex")}.${tag.toString("hex")}`;
}

function decryptPrivateKey(payload: string): Hex {
  const [ivHex, encryptedHex, tagHex] = payload.split(".");

  if (!ivHex || !encryptedHex || !tagHex) {
    throw new Error("Invalid encrypted private key payload.");
  }

  const key = createEncryptionKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]).toString("utf8");
  return decrypted as Hex;
}

function createDefaultFunding(role: ManagedRole) {
  if (role === "Buyer") {
    return {
      ethTarget: "0.015",
      ethThreshold: "0.008",
      tusdTarget: "100000",
      tusdThreshold: "25000",
    };
  }

  if (role === "Seller") {
    return {
      ethTarget: "0.005",
      ethThreshold: "0.002",
      tusdTarget: "10000",
      tusdThreshold: "1000",
    };
  }

  return {
    ethTarget: "0.01",
    ethThreshold: "0.004",
    tusdTarget: "10000",
    tusdThreshold: "0",
  };
}

function createCounterpartyRecord(wallet: CustodialWalletRecord): Counterparty | null {
  if (wallet.role === "Arbitrator") {
    return null;
  }

  return {
    company: wallet.company,
    handle: wallet.handle,
    role: wallet.role,
    location: wallet.location,
    trustScore: wallet.trustScore,
    totalDeals: 0,
    escrowVolume: "$0.00",
    lastDeal: "N/A",
    status: wallet.counterpartyStatus,
    wallet: wallet.address,
  };
}

function createInitialRegistry(targetUserCount: number, dailyUserStartDate: string): CustodialRegistry {
  const timestamp = nowIso();
  return {
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    wallets: [],
    pool: {
      address: getPoolAccount().address,
      reserveEthTarget: "2",
      reserveTusdTarget: "1500000",
      reserveTusdMintSize: "3000000",
      updatedAt: timestamp,
    },
    automation: {
      targetUserCount,
      dailyUserStartDate,
      activityIntervalSeconds: 60,
      activityEnabled: true,
      dailyUserEnabled: true,
      nextBuyerSequence: 1,
      nextSellerSequence: 1,
      nextCountryCursor: 0,
    },
    recentActivity: [],
  };
}

async function readRegistry() {
  const redis = getRedisOrThrow();
  const registry = (await redis.get<CustodialRegistry>(registryKey)) ?? null;

  if (!registry) {
    return null;
  }

  if (registry.automation.activityIntervalSeconds !== 60) {
    registry.automation.activityIntervalSeconds = 60;
    registry.updatedAt = nowIso();
    await redis.set(registryKey, registry);
  }

  return registry;
}

async function writeRegistry(registry: CustodialRegistry) {
  const redis = getRedisOrThrow();
  registry.updatedAt = nowIso();
  await redis.set(registryKey, registry);
}

function appendActivity(registry: CustodialRegistry, entry: Omit<MarketActivity, "id" | "createdAt">) {
  registry.recentActivity = [
    {
      id: randomUUID(),
      createdAt: nowIso(),
      ...entry,
    },
    ...registry.recentActivity,
  ].slice(0, 120);
}

function buildGeneratedIdentity(role: Extract<ManagedRole, "Buyer" | "Seller">, sequence: number) {
  const seeds = role === "Buyer" ? buyerIdentitySeeds : sellerIdentitySeeds;
  const seed = seeds[(sequence - 1) % seeds.length];
  const suffix = String(sequence).padStart(2, "0");
  const company = `${seed[0]} ${suffix}`;
  const handle = `@${company.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16)}${suffix}`;

  return {
    company,
    handle,
    countryCode: seed[1],
    countryName: seed[2],
    city: seed[3],
  };
}

function buildWalletRecord(input: BootstrapWalletInput, source: WalletSource, createdAt = nowIso()): CustodialWalletRecord {
  const account = privateKeyToAccount(input.privateKey);
  return {
    id: randomUUID(),
    address: account.address,
    encryptedPrivateKey: encryptPrivateKey(input.privateKey),
    role: input.role,
    company: input.company,
    handle: input.handle,
    countryCode: input.countryCode,
    countryName: input.countryName,
    city: input.city,
    location: `${input.city}, ${input.countryName}`,
    source,
    active: true,
    autoBuyer: input.role === "Buyer",
    createdAt,
    updatedAt: createdAt,
    trustScore: input.trustScore ?? (input.role === "Buyer" ? 92 : input.role === "Seller" ? 91 : 96),
    counterpartyStatus: input.status ?? (input.role === "Buyer" || input.role === "Seller" ? "Verified" : "Trusted"),
    funding: createDefaultFunding(input.role),
  };
}

function upsertWallet(registry: CustodialRegistry, wallet: CustodialWalletRecord) {
  const index = registry.wallets.findIndex((entry) => entry.address.toLowerCase() === wallet.address.toLowerCase());

  if (index === -1) {
    registry.wallets.push(wallet);
    return wallet;
  }

  registry.wallets[index] = {
    ...registry.wallets[index],
    ...wallet,
    id: registry.wallets[index].id,
    createdAt: registry.wallets[index].createdAt,
    updatedAt: nowIso(),
  };

  return registry.wallets[index];
}

function countManagedUsers(registry: CustodialRegistry) {
  return registry.wallets.filter((wallet) => wallet.role === "Buyer" || wallet.role === "Seller" || wallet.role === "Arbitrator").length;
}

function countRole(registry: CustodialRegistry, role: ManagedRole) {
  return registry.wallets.filter((wallet) => wallet.role === role).length;
}

function countActiveRole(registry: CustodialRegistry, role: ManagedRole) {
  return registry.wallets.filter((wallet) => wallet.role === role && wallet.active).length;
}

function summarizeRegistry(registry: CustodialRegistry): CustodySummary {
  const activeWallets = registry.wallets.filter((wallet) => wallet.active);
  return {
    totalWallets: registry.wallets.length,
    activeWallets: activeWallets.length,
    buyers: countRole(registry, "Buyer"),
    activeBuyers: countActiveRole(registry, "Buyer"),
    sellers: countRole(registry, "Seller"),
    activeSellers: countActiveRole(registry, "Seller"),
    arbitrators: countRole(registry, "Arbitrator"),
    activeArbitrators: countActiveRole(registry, "Arbitrator"),
    poolAddress: registry.pool.address,
    poolEthBalance: registry.pool.balances?.eth,
    poolTusdBalance: registry.pool.balances?.tusd,
    dailyUserStartDate: registry.automation.dailyUserStartDate,
    lastDailyUserDate: registry.automation.lastDailyUserDate,
    activityIntervalSeconds: registry.automation.activityIntervalSeconds,
    recentActivity: registry.recentActivity.slice(0, 12),
    activeWalletRows: activeWallets
      .map((wallet) => ({
        id: wallet.id,
        address: wallet.address,
        role: wallet.role,
        company: wallet.company,
        countryName: wallet.countryName,
        active: wallet.active,
        source: wallet.source,
        balances: wallet.balances,
      }))
      .sort((left, right) => left.role.localeCompare(right.role) || left.company.localeCompare(right.company)),
  };
}

async function getWalletBalances(address: Hex) {
  const client = createPublicArbitrumClient();
  const [ethBalance, tusdBalance] = await Promise.all([
    client.getBalance({ address }),
    client.readContract({
      address: appEnv.settlementTokenAddress as Hex,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    }) as Promise<bigint>,
  ]);

  return {
    eth: formatEther(ethBalance),
    tusd: formatUnits(tusdBalance, 6),
    updatedAt: nowIso(),
  };
}

async function refreshRegistryBalances(registry: CustodialRegistry, addresses?: Hex[]) {
  const tracked = addresses?.map((value) => value.toLowerCase());

  for (const wallet of registry.wallets) {
    if (tracked && !tracked.includes(wallet.address.toLowerCase())) {
      continue;
    }

    wallet.balances = await getWalletBalances(wallet.address);
    wallet.updatedAt = nowIso();
  }

  const poolBalances = await getWalletBalances(registry.pool.address);
  registry.pool.balances = poolBalances;
  registry.pool.updatedAt = nowIso();
}

async function ensureTusdPoolReserve(registry: CustodialRegistry) {
  const reserveTarget = parseUnits(registry.pool.reserveTusdTarget, 6);
  const mintSize = parseUnits(registry.pool.reserveTusdMintSize, 6);
  const client = createPublicArbitrumClient();
  const currentBalance = (await client.readContract({
    address: appEnv.settlementTokenAddress as Hex,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [registry.pool.address],
  })) as bigint;

  if (currentBalance >= reserveTarget) {
    return [];
  }

  const walletClient = createPoolWalletClient();
  const hash = await walletClient.writeContract({
    address: appEnv.settlementTokenAddress as Hex,
    abi: erc20Abi,
    functionName: "mint",
    args: [registry.pool.address, mintSize],
    account: walletClient.account,
    chain: arbitrumSepolia,
  });
  await client.waitForTransactionReceipt({ hash });

  return [hash];
}

async function topUpWallet(
  registry: CustodialRegistry,
  wallet: CustodialWalletRecord,
  options: {
    requiredEthTarget?: number;
    requiredTusdTarget?: number;
  } = {},
) {
  const txHashes: Hex[] = [];
  const publicClient = createPublicArbitrumClient();
  const poolWalletClient = createPoolWalletClient();
  const balances = await getWalletBalances(wallet.address);
  wallet.balances = balances;

  const currentEth = parseDecimal(balances.eth);
  const currentTusd = parseDecimal(balances.tusd);
  const ethTarget = Math.max(parseDecimal(wallet.funding.ethTarget), options.requiredEthTarget ?? 0);
  const ethThreshold = parseDecimal(wallet.funding.ethThreshold);
  const tusdTarget = Math.max(parseDecimal(wallet.funding.tusdTarget), options.requiredTusdTarget ?? 0);
  const tusdThreshold = parseDecimal(wallet.funding.tusdThreshold);

  if (currentEth < ethThreshold) {
    const deficiency = Math.max(ethTarget - currentEth, 0);

    if (deficiency > 0) {
      const hash = await poolWalletClient.sendTransaction({
        account: poolWalletClient.account,
        chain: arbitrumSepolia,
        to: wallet.address,
        value: parseEther(deficiency.toFixed(6)),
      });
      await publicClient.waitForTransactionReceipt({ hash });
      txHashes.push(hash);
    }
  }

  if (wallet.role !== "Arbitrator" && (currentTusd < tusdThreshold || currentTusd < tusdTarget)) {
    const reserveHashes = await ensureTusdPoolReserve(registry);
    txHashes.push(...reserveHashes);

    const deficiency = Math.max(tusdTarget - currentTusd, 0);

    if (deficiency > 0) {
      const hash = await poolWalletClient.writeContract({
        address: appEnv.settlementTokenAddress as Hex,
        abi: erc20Abi,
        functionName: "transfer",
        args: [wallet.address, parseUnits(deficiency.toFixed(2), 6)],
        account: poolWalletClient.account,
        chain: arbitrumSepolia,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      txHashes.push(hash);
    }
  }

  if (txHashes.length > 0) {
    wallet.lastFundedAt = nowIso();
    wallet.updatedAt = nowIso();
  }

  wallet.balances = await getWalletBalances(wallet.address);
  return txHashes;
}

async function topUpManagedWallets(
  registry: CustodialRegistry,
  addresses?: Hex[],
  options: {
    perWallet?: Partial<Record<string, { requiredEthTarget?: number; requiredTusdTarget?: number }>>;
  } = {},
) {
  const tracked = addresses?.map((value) => value.toLowerCase());
  const txHashes: Hex[] = [];

  for (const wallet of registry.wallets) {
    if (tracked && !tracked.includes(wallet.address.toLowerCase())) {
      continue;
    }

    const walletOptions = options.perWallet?.[wallet.address.toLowerCase()];
    const hashes = await topUpWallet(registry, wallet, walletOptions);
    txHashes.push(...hashes);
  }

  await refreshRegistryBalances(registry, addresses);
  return txHashes;
}

function chooseGeneratedWalletToDeactivate(registry: CustodialRegistry, role: ManagedRole, protectedAddresses: Set<string>) {
  return [...registry.wallets]
    .reverse()
    .find(
      (wallet) =>
        wallet.role === role &&
        wallet.source === "generated" &&
        wallet.active &&
        !protectedAddresses.has(wallet.address.toLowerCase()),
    );
}

function toPrivateKey(wallet: CustodialWalletRecord) {
  return decryptPrivateKey(wallet.encryptedPrivateKey);
}

function createWalletClientForRecord(wallet: CustodialWalletRecord) {
  const privateKey = toPrivateKey(wallet);
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(appEnv.arbitrumSepoliaRpcUrl),
  });
}

function selectBuyer(registry: CustodialRegistry, preferredAddress?: Hex) {
  if (preferredAddress) {
    const preferred = registry.wallets.find(
      (wallet) => wallet.role === "Buyer" && wallet.address.toLowerCase() === preferredAddress.toLowerCase(),
    );

    if (preferred) {
      return preferred;
    }
  }

  const buyers = registry.wallets.filter((wallet) => wallet.role === "Buyer" && wallet.active);
  return buyers[Math.floor(Math.random() * buyers.length)] ?? null;
}

function selectSeller(registry: CustodialRegistry, buyer: CustodialWalletRecord) {
  const sellers = registry.wallets.filter(
    (wallet) => wallet.role === "Seller" && wallet.active && wallet.countryCode !== buyer.countryCode,
  );
  return sellers[Math.floor(Math.random() * sellers.length)] ?? registry.wallets.find((wallet) => wallet.role === "Seller") ?? null;
}

function buildAutoDealId() {
  return `AUTO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function buildAutoProofHash(dealId: string) {
  return `AUTO-PROOF-${dealId}`;
}

async function syncSettingsSummary(registry: CustodialRegistry) {
  const settings = buildLiveSettingsState(registry);

  await updateSettings({
    workspaceSummary: settings.workspaceSummary,
    securitySummary: settings.securitySummary,
  });
}

function buildWorkspaceSummary(registry: CustodialRegistry): SummaryItem[] {
  const activeWalletCount = registry.wallets.filter((wallet) => wallet.active).length;

  return [
    { label: "Verified Business", value: "Verified" },
    { label: "Managed User Wallets", value: `${activeWalletCount}` },
    { label: "Custodial Pool", value: registry.pool.address.slice(0, 10) },
    { label: "Default Network", value: "Arbitrum Sepolia" },
    { label: "Daily User Start", value: registry.automation.dailyUserStartDate },
    { label: "Activity Cadence", value: `${registry.automation.activityIntervalSeconds}s` },
    { label: "Pool ETH Reserve", value: `${registry.pool.reserveEthTarget} ETH` },
  ];
}

function buildSecuritySummary(registry: CustodialRegistry): SummaryItem[] {
  return [
    { label: "Custody Model", value: "Server-managed" },
    { label: "Pool Signer", value: registry.pool.address.slice(0, 10) },
    { label: "Wallet Encryption", value: appEnv.custodyEncryptionKey ? "Enabled" : "Missing" },
    { label: "Automation Auth", value: appEnv.automationToken ? "Enabled" : "Open" },
  ];
}

function buildLiveSettingsState(registry: CustodialRegistry): SettingsState {
  return {
    ...createDefaultSettingsState(),
    workspaceSummary: buildWorkspaceSummary(registry),
    securitySummary: buildSecuritySummary(registry),
  };
}

function buildLivePersistedState(registry: CustodialRegistry): PersistedState {
  return {
    deals: [],
    disputes: [],
    auditEvents: [],
    counterparties: registry.wallets
      .filter((wallet) => wallet.active)
      .map(createCounterpartyRecord)
      .filter((entry): entry is Counterparty => Boolean(entry)),
    settings: buildLiveSettingsState(registry),
  };
}

function ensureConfiguredAddresses() {
  if (!appEnv.escrowContractAddress || !appEnv.settlementTokenAddress) {
    throw new Error("Escrow or settlement token address is missing from env.");
  }
}

async function runDealLifecycle(
  registry: CustodialRegistry,
  buyer: CustodialWalletRecord,
  seller: CustodialWalletRecord,
): Promise<DealLifecycleResult> {
  ensureConfiguredAddresses();

  const amountOptions = [25000, 35000, 50000, 65000];
  const amount = amountOptions[Math.floor(Math.random() * amountOptions.length)] ?? 25000;
  const amountRaw = amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const amountUnits = parseUnits(String(amount), 6);
  const dealId = buildAutoDealId();
  const proofHash = buildAutoProofHash(dealId);
  const metadataUri = `tradelock://automation/deals/${dealId}`;

  const publicClient = createPublicArbitrumClient();
  const buyerClient = createWalletClientForRecord(buyer);
  const sellerClient = createWalletClientForRecord(seller);
  const txHashes: Hex[] = [];
  txHashes.push(
    ...(await topUpWallet(registry, buyer, {
      requiredEthTarget: parseDecimal(buyer.funding.ethTarget),
      requiredTusdTarget: amount + 5000,
    })),
  );
  txHashes.push(
    ...(await topUpWallet(registry, seller, {
      requiredEthTarget: parseDecimal(seller.funding.ethTarget),
    })),
  );
  let buyerNonce = await publicClient.getTransactionCount({
    address: buyer.address,
    blockTag: "pending",
  });
  let sellerNonce = await publicClient.getTransactionCount({
    address: seller.address,
    blockTag: "pending",
  });

  const createHash = await buyerClient.writeContract({
    address: appEnv.escrowContractAddress as Hex,
    abi: escrowAbi,
    functionName: "createDeal",
    args: [dealId, seller.address, appEnv.settlementTokenAddress as Hex, amountUnits, metadataUri],
    account: buyerClient.account,
    chain: arbitrumSepolia,
    nonce: buyerNonce++,
  });
  await publicClient.waitForTransactionReceipt({ hash: createHash });
  txHashes.push(createHash);

  await createBackendDeal({
    id: dealId,
    buyer: buyer.company,
    buyerLocation: buyer.countryName,
    seller: seller.company,
    sellerLocation: seller.countryName,
    amountRaw,
    milestone: "Automated procurement cycle",
    progress: "1/3",
    proofStatus: "Waiting Proof",
    status: "Active",
    network: "Arbitrum Sepolia",
    proofFile: "AutoProofPending",
    proofHash: "Pending",
    txHash: createHash,
  });

  const approveHash = await buyerClient.writeContract({
    address: appEnv.settlementTokenAddress as Hex,
    abi: erc20Abi,
    functionName: "approve",
    args: [appEnv.escrowContractAddress as Hex, amountUnits],
    account: buyerClient.account,
    chain: arbitrumSepolia,
    nonce: buyerNonce++,
  });
  await publicClient.waitForTransactionReceipt({ hash: approveHash });
  txHashes.push(approveHash);

  const fundHash = await buyerClient.writeContract({
    address: appEnv.escrowContractAddress as Hex,
    abi: escrowAbi,
    functionName: "fundDeal",
    args: [dealId],
    account: buyerClient.account,
    chain: arbitrumSepolia,
    nonce: buyerNonce++,
  });
  await publicClient.waitForTransactionReceipt({ hash: fundHash });
  txHashes.push(fundHash);

  await updateDeal(dealId, {
    status: "Funded",
    proofStatus: "Waiting Proof",
    progress: "1/3",
  });

  await createAuditEvent({
    dealId,
    type: "Deposit Funded",
    actor: buyer.company,
    asset: formatUsdAmount(amount),
    status: "Confirmed",
    txHash: fundHash,
  });

  const proofTxHash = await sellerClient.writeContract({
    address: appEnv.escrowContractAddress as Hex,
    abi: escrowAbi,
    functionName: "submitProofHash",
    args: [dealId, proofHash],
    account: sellerClient.account,
    chain: arbitrumSepolia,
    nonce: sellerNonce++,
  });
  await publicClient.waitForTransactionReceipt({ hash: proofTxHash });
  txHashes.push(proofTxHash);

  await updateDeal(dealId, {
    status: "Ready to Release",
    proofStatus: "Submitted",
    progress: "2/3",
    proofHash,
    proofFile: `${proofHash}.json`,
  });

  await createAuditEvent({
    dealId,
    type: "Proof Uploaded",
    actor: seller.company,
    asset: formatUsdAmount(amount),
    status: "Submitted",
    txHash: proofTxHash,
    proofHash,
    proofFile: `${proofHash}.json`,
  });

  const disputeOpened = Math.random() < 0.16;

  if (disputeOpened) {
    const disputeHash = await sellerClient.writeContract({
      address: appEnv.escrowContractAddress as Hex,
      abi: escrowAbi,
      functionName: "openDispute",
      args: [dealId, "Auto QA mismatch detected"],
      account: sellerClient.account,
      chain: arbitrumSepolia,
      nonce: sellerNonce++,
    });
    await publicClient.waitForTransactionReceipt({ hash: disputeHash });
    txHashes.push(disputeHash);

    await updateDeal(dealId, {
      status: "Disputed",
      proofStatus: "Submitted",
      progress: "2/3",
    });

    await createDispute({
      dealId,
      buyer: buyer.company,
      seller: seller.company,
      amount: formatUsdAmount(amount),
      reason: "Auto QA mismatch detected",
      evidenceStatus: "Evidence Submitted",
      status: "Under Review",
      txHash: disputeHash,
    });

    await createAuditEvent({
      dealId,
      type: "Dispute Events",
      actor: seller.company,
      asset: formatUsdAmount(amount),
      status: "Under Review",
      txHash: disputeHash,
      proofHash,
    });

    return { dealId, disputeOpened: true, txHashes };
  }

  const releaseHash = await buyerClient.writeContract({
    address: appEnv.escrowContractAddress as Hex,
    abi: escrowAbi,
    functionName: "releaseFunds",
    args: [dealId],
    account: buyerClient.account,
    chain: arbitrumSepolia,
    nonce: buyerNonce++,
  });
  await publicClient.waitForTransactionReceipt({ hash: releaseHash });
  txHashes.push(releaseHash);

  await updateDeal(dealId, {
    status: "Completed",
    proofStatus: "Proof Verified",
    progress: "3/3",
  });

  await createAuditEvent({
    dealId,
    type: "Funds Released",
    actor: buyer.company,
    asset: formatUsdAmount(amount),
    status: "Finalized",
    txHash: releaseHash,
    proofHash,
  });

  return { dealId, disputeOpened: false, txHashes };
}

export async function getCustodialRegistry() {
  return readRegistry();
}

export async function getCustodialSummary() {
  const registry = await readRegistry();
  return registry ? summarizeRegistry(registry) : null;
}

export async function getCustodialHealth() {
  try {
    const registry = await readRegistry();
    return {
      configured: hasCustodyConfig(),
      healthy: Boolean(registry),
      detail: registry ? `${countManagedUsers(registry)} managed user wallet(s) ready.` : "Custodial registry not initialized.",
    };
  } catch (error) {
    return {
      configured: hasCustodyConfig(),
      healthy: false,
      detail: error instanceof Error ? error.message : "Unknown custodial engine error.",
    };
  }
}

export async function bootstrapCustodialRegistry(options: {
  importedWallets: BootstrapWalletInput[];
  targetUserCount: number;
  dailyUserStartDate: string;
}) {
  ensureConfiguredAddresses();
  const registry = (await readRegistry()) ?? createInitialRegistry(options.targetUserCount, options.dailyUserStartDate);

  registry.automation.targetUserCount = options.targetUserCount;
  registry.automation.dailyUserStartDate = options.dailyUserStartDate;
  registry.automation.activityIntervalSeconds = 60;

  for (const input of options.importedWallets) {
    upsertWallet(registry, buildWalletRecord(input, "imported"));
  }

  if (countRole(registry, "Arbitrator") === 0) {
    const privateKey = generatePrivateKey();
    upsertWallet(
      registry,
      buildWalletRecord(
        {
          privateKey,
          role: "Arbitrator",
          company: "TradeLock Arbitration Desk",
          handle: "@tradelockarb",
          countryCode: "CH",
          countryName: "Switzerland",
          city: "Geneva",
          trustScore: 99,
          status: "Trusted",
        },
        "generated",
      ),
    );
  }

  const targetBuyerCount = Math.ceil((options.targetUserCount - 1) / 2);
  const targetSellerCount = options.targetUserCount - 1 - targetBuyerCount;

  while (countRole(registry, "Buyer") < targetBuyerCount) {
    const sequence = registry.automation.nextBuyerSequence++;
    const identity = buildGeneratedIdentity("Buyer", sequence);
    const privateKey = generatePrivateKey();
    upsertWallet(
      registry,
      buildWalletRecord(
        {
          privateKey,
          role: "Buyer",
          ...identity,
        },
        "generated",
      ),
    );
  }

  while (countRole(registry, "Seller") < targetSellerCount) {
    const sequence = registry.automation.nextSellerSequence++;
    const identity = buildGeneratedIdentity("Seller", sequence);
    const privateKey = generatePrivateKey();
    upsertWallet(
      registry,
      buildWalletRecord(
        {
          privateKey,
          role: "Seller",
          ...identity,
        },
        "generated",
      ),
    );
  }

  const counterparties = registry.wallets
    .map(createCounterpartyRecord)
    .filter((entry): entry is Counterparty => Boolean(entry));
  await upsertCounterparties(counterparties);

  const topUpHashes = await topUpManagedWallets(registry);
  await syncSettingsSummary(registry);
  appendActivity(registry, {
    type: "bootstrap",
    summary: `Custodial wallet engine initialized with ${countManagedUsers(registry)} managed users.`,
    txHashes: topUpHashes,
  });
  await writeRegistry(registry);

  return registry;
}

export async function reconcileImportedWallets(importedWallets: BootstrapWalletInput[]) {
  const registry = await readRegistry();

  if (!registry) {
    throw new Error("Custodial registry is not initialized.");
  }

  const protectedAddresses = new Set<string>();
  const importedRecords = importedWallets.map((input) => buildWalletRecord(input, "imported"));

  for (const record of importedRecords) {
    protectedAddresses.add(record.address.toLowerCase());
  }

  for (const record of importedRecords) {
    const existingByAddress = registry.wallets.find(
      (wallet) => wallet.address.toLowerCase() === record.address.toLowerCase(),
    );

    if (existingByAddress) {
      existingByAddress.role = record.role;
      existingByAddress.company = record.company;
      existingByAddress.handle = record.handle;
      existingByAddress.countryCode = record.countryCode;
      existingByAddress.countryName = record.countryName;
      existingByAddress.city = record.city;
      existingByAddress.location = record.location;
      existingByAddress.source = "imported";
      existingByAddress.active = true;
      existingByAddress.autoBuyer = record.autoBuyer;
      existingByAddress.trustScore = record.trustScore;
      existingByAddress.counterpartyStatus = record.counterpartyStatus;
      existingByAddress.funding = record.funding;
      existingByAddress.updatedAt = nowIso();
    } else {
      const replacement = chooseGeneratedWalletToDeactivate(registry, record.role, protectedAddresses);

      if (replacement) {
        replacement.active = false;
        replacement.updatedAt = nowIso();
      }

      upsertWallet(registry, {
        ...record,
        active: true,
      });
    }
  }

  const counterparties = registry.wallets
    .filter((wallet) => wallet.active)
    .map(createCounterpartyRecord)
    .filter((entry): entry is Counterparty => Boolean(entry));

  await upsertCounterparties(counterparties);
  await topUpManagedWallets(
    registry,
    importedRecords.map((record) => record.address),
  );
  await syncSettingsSummary(registry);
  appendActivity(registry, {
    type: "bootstrap",
    summary: `Imported wallet set merged into the active custody network.`,
    txHashes: [],
  });
  await writeRegistry(registry);

  return registry;
}

export async function runActivityCycle(options: { preferredBuyerAddress?: Hex } = {}) {
  const registry = await readRegistry();

  if (!registry) {
    throw new Error("Custodial registry is not initialized.");
  }

  const buyer = selectBuyer(registry, options.preferredBuyerAddress);

  if (!buyer) {
    throw new Error("No buyer wallet is available for automation.");
  }

  const seller = selectSeller(registry, buyer);

  if (!seller) {
    throw new Error("No seller wallet is available for automation.");
  }

  const fundingHashes = await topUpManagedWallets(registry, [buyer.address, seller.address]);
  const lifecycle = await runDealLifecycle(registry, buyer, seller);

  buyer.lastActivityAt = nowIso();
  seller.lastActivityAt = nowIso();
  await refreshRegistryBalances(registry, [buyer.address, seller.address]);
  await syncSettingsSummary(registry);

  appendActivity(registry, {
    type: lifecycle.disputeOpened ? "dispute" : "activity",
    summary: lifecycle.disputeOpened
      ? `${buyer.company} opened a live dispute with ${seller.company}.`
      : `${buyer.company} completed an automated purchase from ${seller.company}.`,
    dealId: lifecycle.dealId,
    txHashes: [...fundingHashes, ...lifecycle.txHashes],
  });
  await writeRegistry(registry);

  return lifecycle;
}

export async function runActivityCycleByBuyerCompany(company: string) {
  const registry = await readRegistry();

  if (!registry) {
    throw new Error("Custodial registry is not initialized.");
  }

  const buyer = registry.wallets.find(
    (wallet) => wallet.role === "Buyer" && wallet.active && wallet.company === company,
  );

  if (!buyer) {
    throw new Error(`Active buyer wallet not found for ${company}.`);
  }

  return runActivityCycle({ preferredBuyerAddress: buyer.address });
}

export async function runDailyUserCycle(date = new Date()) {
  const registry = await readRegistry();

  if (!registry) {
    throw new Error("Custodial registry is not initialized.");
  }

  const currentDate = date.toISOString().slice(0, 10);

  if (!registry.automation.dailyUserEnabled) {
    return { skipped: true, reason: "Daily user automation is disabled." };
  }

  if (currentDate < registry.automation.dailyUserStartDate) {
    return { skipped: true, reason: `Daily user automation starts on ${registry.automation.dailyUserStartDate}.` };
  }

  if (registry.automation.lastDailyUserDate === currentDate) {
    return { skipped: true, reason: `Daily user for ${currentDate} is already provisioned.` };
  }

  const sequence = registry.automation.nextBuyerSequence++;
  const identity = buildGeneratedIdentity("Buyer", sequence);
  const privateKey = generatePrivateKey();
  const wallet = buildWalletRecord(
    {
      privateKey,
      role: "Buyer",
      ...identity,
      status: "Verified",
      trustScore: 90,
    },
    "generated",
  );

  upsertWallet(registry, wallet);
  await upsertCounterparties([createCounterpartyRecord(wallet)].filter((entry): entry is Counterparty => Boolean(entry)));

  const fundingHashes = await topUpManagedWallets(registry, [wallet.address]);
  registry.automation.lastDailyUserDate = currentDate;
  appendActivity(registry, {
    type: "daily-user",
    summary: `New buyer ${wallet.company} joined from ${wallet.countryName}.`,
    txHashes: fundingHashes,
  });
  await writeRegistry(registry);

  const lifecycle = await runActivityCycle({ preferredBuyerAddress: wallet.address });
  return {
    skipped: false,
    wallet: {
      company: wallet.company,
      address: wallet.address,
      country: wallet.countryName,
    },
    lifecycle,
  };
}

export async function rebuildLiveWorkspaceState() {
  const registry = await readRegistry();

  if (!registry) {
    throw new Error("Custodial registry is not initialized.");
  }

  const liveState = buildLivePersistedState(registry);
  registry.automation.activityIntervalSeconds = 60;
  const replaced = await replaceSupabaseState(liveState);

  if (!replaced) {
    throw new Error("Could not replace Supabase state with live custody data.");
  }

  await resetAppStateCache();
  await syncSettingsSummary(registry);
  appendActivity(registry, {
    type: "bootstrap",
    summary: `Live workspace state rebuilt from ${liveState.counterparties.length} managed counterparties.`,
    txHashes: [],
  });
  await writeRegistry(registry);

  return {
    counterparties: liveState.counterparties.length,
    deals: liveState.deals.length,
    disputes: liveState.disputes.length,
    auditEvents: liveState.auditEvents.length,
  };
}

function pickSellerForBuyer(sellers: CustodialWalletRecord[], buyer: CustodialWalletRecord, cursor: number) {
  if (sellers.length === 0) {
    return null;
  }

  for (let offset = 0; offset < sellers.length; offset += 1) {
    const seller = sellers[(cursor + offset) % sellers.length];

    if (seller && seller.countryCode !== buyer.countryCode) {
      return seller;
    }
  }

  return sellers[cursor % sellers.length] ?? null;
}

export async function runFanoutActivityCycle() {
  const registry = await readRegistry();

  if (!registry) {
    throw new Error("Custodial registry is not initialized.");
  }

  const buyers = registry.wallets.filter((wallet) => wallet.role === "Buyer" && wallet.active);
  const sellers = registry.wallets.filter((wallet) => wallet.role === "Seller" && wallet.active);

  if (buyers.length === 0 || sellers.length === 0) {
    throw new Error("Active buyer or seller wallets are missing.");
  }

  const createdDeals: string[] = [];
  const disputeDeals: string[] = [];
  const allTxHashes: string[] = [];

  for (const [index, buyer] of buyers.entries()) {
    const seller = pickSellerForBuyer(sellers, buyer, index);

    if (!seller) {
      continue;
    }

    const fundingHashes = await topUpManagedWallets(registry, [buyer.address, seller.address]);
    const lifecycle = await runDealLifecycle(registry, buyer, seller);
    buyer.lastActivityAt = nowIso();
    seller.lastActivityAt = nowIso();
    createdDeals.push(lifecycle.dealId);
    allTxHashes.push(...fundingHashes, ...lifecycle.txHashes);

    if (lifecycle.disputeOpened) {
      disputeDeals.push(lifecycle.dealId);
    }

    appendActivity(registry, {
      type: lifecycle.disputeOpened ? "dispute" : "activity",
      summary: lifecycle.disputeOpened
        ? `${buyer.company} opened a live dispute with ${seller.company}.`
        : `${buyer.company} completed an automated purchase from ${seller.company}.`,
      dealId: lifecycle.dealId,
      txHashes: [...fundingHashes, ...lifecycle.txHashes],
    });
  }

  await refreshRegistryBalances(registry, [...buyers.map((wallet) => wallet.address), ...sellers.map((wallet) => wallet.address)]);
  await syncSettingsSummary(registry);
  await writeRegistry(registry);

  return {
    buyersProcessed: buyers.length,
    sellersAvailable: sellers.length,
    dealsCreated: createdDeals.length,
    disputesOpened: disputeDeals.length,
    dealIds: createdDeals,
    txHashes: allTxHashes,
  };
}
