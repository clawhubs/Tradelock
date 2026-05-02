import {
  auditFilters,
  counterpartyFilters,
  createFields,
  createSteps,
  dealFilters,
  disputeFilters,
} from "@/lib/mock-data";
import type {
  AuditEvent,
  Counterparty,
  Deal,
  Dispute,
  SettingsState,
  StatCard,
  TradeLockAppState,
} from "@/lib/types";
import { getRedisClient } from "@/lib/services/redis";
import { ensureSupabaseInitialized, getSupabaseStoreHealth, writeSupabaseState } from "@/lib/services/tradelock-supabase-store";
import { createDefaultState, type PersistedState } from "@/lib/tradelock-default-state";

type DealInput = Partial<
  Pick<
    Deal,
    | "buyer"
    | "buyerLocation"
    | "seller"
    | "sellerLocation"
    | "amountRaw"
    | "milestone"
    | "progress"
    | "proofStatus"
    | "status"
    | "network"
    | "proofFile"
    | "proofHash"
    | "txHash"
  >
> & { id?: string };

const appStateCacheKey = "tradelock:app-state:v1";

function parseAmount(value: string) {
  return Number(value.replace(/[^0-9.]/g, ""));
}

function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

function formatTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .replace(",", "")
    .replace(" at ", " ");
}

function formatAmount(amountRaw: string) {
  const value = Number(amountRaw.replace(/,/g, ""));
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`;
}

async function writeState(state: PersistedState) {
  const ok = await writeSupabaseState(state);

  if (!ok) {
    throw new Error("Unable to persist state to Supabase.");
  }

  await invalidateAppStateCache();
}

async function readState(): Promise<PersistedState> {
  return ensureSupabaseInitialized(createDefaultState());
}

async function readAppStateCache() {
  const redis = getRedisClient();

  if (!redis) {
    return null;
  }

  try {
    return await redis.get<TradeLockAppState>(appStateCacheKey);
  } catch {
    return null;
  }
}

async function writeAppStateCache(data: TradeLockAppState) {
  const redis = getRedisClient();

  if (!redis) {
    return;
  }

  try {
    await redis.set(appStateCacheKey, data, { ex: 120 });
  } catch {
    // Ignore cache write failures and continue with the Supabase store.
  }
}

async function invalidateAppStateCache() {
  const redis = getRedisClient();

  if (!redis) {
    return;
  }

  try {
    await redis.del(appStateCacheKey);
  } catch {
    // Ignore cache invalidation failures.
  }
}

function syncCounterparties(counterparties: Counterparty[], deals: Deal[]) {
  return counterparties.map((entry) => {
    const relatedDeals = deals.filter((deal) => deal.buyer === entry.company || deal.seller === entry.company);
    const totalVolume = relatedDeals.reduce((sum, deal) => sum + parseAmount(deal.amountRaw), 0);
    const latestDeal = [...relatedDeals].sort(
      (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime(),
    )[0];

    return {
      ...entry,
      totalDeals: relatedDeals.length,
      escrowVolume: formatUsd(totalVolume),
      lastDeal: latestDeal ? latestDeal.updated : "N/A",
    };
  });
}

function buildOverviewStats(deals: Deal[], disputes: Dispute[]): StatCard[] {
  const totalEscrowVolume = deals.reduce((sum, deal) => sum + parseAmount(deal.amountRaw), 0);
  const activeDealsCount = deals.filter((deal) => deal.status !== "Completed").length;
  const pendingReleaseVolume = deals
    .filter((deal) => deal.status === "Ready to Release")
    .reduce((sum, deal) => sum + parseAmount(deal.amountRaw), 0);
  const disputesOpenCount = disputes.filter(
    (dispute) => dispute.status === "Under Review" || dispute.status === "Evidence Submitted",
  ).length;

  return [
    { label: "Active Deals", value: formatCount(activeDealsCount), change: "Across all current flows", tone: "blue" },
    { label: "Escrow Volume", value: `${formatUsd(totalEscrowVolume)} USDC`, change: "Unified with deal list", tone: "green" },
    { label: "Pending Release", value: `${formatUsd(pendingReleaseVolume)} USDC`, change: "Ready to settle", tone: "purple" },
    { label: "Disputes Open", value: formatCount(disputesOpenCount), change: "Needs review", tone: "orange" },
  ];
}

function buildDealsStats(deals: Deal[]): StatCard[] {
  const totalEscrowVolume = deals.reduce((sum, deal) => sum + parseAmount(deal.amountRaw), 0);

  return [
    { label: "Total Deals", value: formatCount(deals.length), change: "Synced with dashboard rows", tone: "blue" },
    {
      label: "Active Deals",
      value: formatCount(
        deals.filter((deal) => ["Active", "Waiting Proof", "Proof Verified", "Funded", "Ready to Release"].includes(deal.status))
          .length,
      ),
      change: "In-progress escrow flows",
      tone: "cyan",
    },
    {
      label: "Ready to Release",
      value: formatCount(deals.filter((deal) => deal.status === "Ready to Release").length),
      change: "Buyer approved",
      tone: "green",
    },
    {
      label: "Disputed",
      value: formatCount(deals.filter((deal) => deal.status === "Disputed").length),
      change: "Escalated deals",
      tone: "red",
    },
    { label: "Total Escrow Volume", value: `${formatUsd(totalEscrowVolume)} USDC`, change: "Same source as dashboard", tone: "blue" },
  ];
}

function buildDisputeStats(disputes: Dispute[]): StatCard[] {
  return [
    { label: "Total Disputes", value: formatCount(disputes.length), change: "From current dataset", tone: "blue" },
    {
      label: "Under Review",
      value: formatCount(disputes.filter((dispute) => dispute.status === "Under Review").length),
      change: "Awaiting resolution",
      tone: "cyan",
    },
    {
      label: "Resolved",
      value: formatCount(disputes.filter((dispute) => dispute.status === "Resolved").length),
      change: "Closed successfully",
      tone: "green",
    },
    {
      label: "Evidence Submitted",
      value: formatCount(disputes.filter((dispute) => dispute.status === "Evidence Submitted").length),
      change: "Documents uploaded",
      tone: "red",
    },
    {
      label: "Funds Frozen",
      value: `${formatUsd(disputes.filter((dispute) => dispute.status !== "Resolved").reduce((sum, dispute) => sum + parseAmount(dispute.amount), 0))} USDC`,
      change: "Linked to open disputes",
      tone: "purple",
    },
  ];
}

function buildAuditStats(auditEvents: AuditEvent[]): StatCard[] {
  return [
    { label: "Total Events", value: formatCount(auditEvents.length), change: "On-chain actions tracked", tone: "blue" },
    {
      label: "Verified Events",
      value: formatCount(auditEvents.filter((event) => event.status === "Verified" || event.status === "Finalized").length),
      change: "Confirmed entries",
      tone: "green",
    },
    {
      label: "Deals Tracked",
      value: formatCount(new Set(auditEvents.map((event) => event.dealId)).size),
      change: "Covered by audit log",
      tone: "orange",
    },
    {
      label: "Proof Files",
      value: formatCount(auditEvents.filter((event) => event.proofFile).length),
      change: "Referenced documents",
      tone: "purple",
    },
    {
      label: "Last Synced Block",
      value: formatCount(Math.max(...auditEvents.map((event) => Number(event.block)))),
      change: "Synced with latest event",
      tone: "cyan",
    },
  ];
}

function buildCounterpartyStats(counterparties: Counterparty[]): StatCard[] {
  return [
    { label: "Total Counterparties", value: formatCount(counterparties.length), change: "Unified company directory", tone: "blue" },
    {
      label: "Trusted",
      value: formatCount(counterparties.filter((entry) => entry.status === "Trusted").length),
      change: "Top-rated partners",
      tone: "green",
    },
    {
      label: "Buyers",
      value: formatCount(counterparties.filter((entry) => entry.role === "Buyer").length),
      change: "From dashboard counterparties",
      tone: "cyan",
    },
    {
      label: "Sellers",
      value: formatCount(counterparties.filter((entry) => entry.role === "Seller").length),
      change: "From dashboard counterparties",
      tone: "purple",
    },
    {
      label: "Verified Profiles",
      value: formatCount(counterparties.filter((entry) => entry.status === "Trusted" || entry.status === "Verified").length),
      change: "Consistent with live list",
      tone: "orange",
    },
  ];
}

function randomHex(length: number) {
  const alphabet = "0123456789abcdef";
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function buildTxHash() {
  return `0x${randomHex(64)}`;
}

function nextDealId(existingDeals: Deal[]): string {
  const suffix = randomHex(4).toUpperCase();
  const candidate = `DEAL-${suffix}`;
  return existingDeals.some((deal) => deal.id === candidate) ? nextDealId(existingDeals) : candidate;
}

function nextAuditId(events: AuditEvent[]): string {
  const suffix = randomHex(4).toUpperCase();
  const candidate = `EVT-${suffix}`;
  return events.some((event) => event.id === candidate) ? nextAuditId(events) : candidate;
}

function nextDisputeId(disputes: Dispute[]): string {
  const suffix = randomHex(4).toUpperCase();
  const candidate = `DISPUTE-${suffix}`;
  return disputes.some((entry) => entry.id === candidate) ? nextDisputeId(disputes) : candidate;
}

export async function getAppState(): Promise<TradeLockAppState> {
  const cached = await readAppStateCache();

  if (cached) {
    return cached;
  }

  const state = await readState();
  const counterparties = syncCounterparties(state.counterparties, state.deals);
  const appState: TradeLockAppState = {
    dealFilters,
    disputeFilters,
    auditFilters,
    counterpartyFilters,
    deals: state.deals,
    disputes: state.disputes,
    auditEvents: state.auditEvents,
    counterparties,
    overviewStats: buildOverviewStats(state.deals, state.disputes),
    dealsStats: buildDealsStats(state.deals),
    disputesStats: buildDisputeStats(state.disputes),
    auditStats: buildAuditStats(state.auditEvents),
    counterpartyStats: buildCounterpartyStats(counterparties),
    createSteps,
    createFields,
    settings: state.settings,
  };

  await writeAppStateCache(appState);

  return appState;
}

export async function listDeals() {
  const state = await readState();
  return state.deals;
}

export async function getDeal(id: string) {
  const state = await readState();
  return state.deals.find((deal) => deal.id === id) ?? null;
}

export async function createDeal(input: DealInput = {}) {
  const state = await readState();
  const id = input.id ?? nextDealId(state.deals);
  const amountRaw = input.amountRaw ?? "5,000.00";
  const timestamp = formatTimestamp();
  const txHash = input.txHash ?? buildTxHash();

  const newDeal: Deal = {
    id,
    buyer: input.buyer ?? "GlobalImport Ltd.",
    buyerLocation: input.buyerLocation ?? "Singapore",
    seller: input.seller ?? "Shenzhen Parts Co.",
    sellerLocation: input.sellerLocation ?? "China",
    amount: formatAmount(amountRaw),
    amountRaw,
    milestone: input.milestone ?? "Counterparty review in progress",
    progress: input.progress ?? "0/3",
    proofStatus: input.proofStatus ?? "Waiting Proof",
    status: input.status ?? "Active",
    network: input.network ?? "Arbitrum Sepolia",
    updated: timestamp,
    proofFile: input.proofFile ?? "AwaitingUpload",
    txHash,
    proofHash: input.proofHash ?? "Pending",
  };

  const auditEvent: AuditEvent = {
    id: nextAuditId(state.auditEvents),
    dealId: newDeal.id,
    type: "Deal Created",
    actor: newDeal.buyer,
    asset: newDeal.amount,
    status: "Confirmed",
    block: `${24570000 + state.auditEvents.length + 1}`,
    timestamp,
    txHash,
    proofHash: "Pending",
    proofFile: newDeal.proofFile,
  };

  state.deals = [newDeal, ...state.deals];
  state.auditEvents = [auditEvent, ...state.auditEvents];
  state.counterparties = syncCounterparties(state.counterparties, state.deals);
  await writeState(state);

  return newDeal;
}

export async function updateDeal(id: string, patch: Partial<Deal>) {
  const state = await readState();
  const index = state.deals.findIndex((deal) => deal.id === id);

  if (index === -1) {
    return null;
  }

  const current = state.deals[index];
  const updatedDeal: Deal = {
    ...current,
    ...patch,
    amount: patch.amountRaw ? formatAmount(patch.amountRaw) : patch.amount ?? current.amount,
    updated: formatTimestamp(),
  };

  state.deals[index] = updatedDeal;
  state.counterparties = syncCounterparties(state.counterparties, state.deals);
  await writeState(state);

  return updatedDeal;
}

export async function listDisputes() {
  const state = await readState();
  return state.disputes;
}

export async function createDispute(input: Partial<Dispute>) {
  const state = await readState();
  const timestamp = formatTimestamp();
  const dispute: Dispute = {
    id: input.id ?? nextDisputeId(state.disputes),
    dealId: input.dealId ?? "DEAL-UNKNOWN",
    buyer: input.buyer ?? "Unknown Buyer",
    seller: input.seller ?? "Unknown Seller",
    amount: input.amount ?? "0.00 USDC",
    reason: input.reason ?? "Manual dispute created",
    evidenceStatus: input.evidenceStatus ?? "Evidence Submitted",
    status: input.status ?? "Under Review",
    updated: timestamp,
    evidenceFiles: input.evidenceFiles ?? [],
    txHash: input.txHash ?? buildTxHash(),
  };

  state.disputes = [dispute, ...state.disputes];
  await writeState(state);

  return dispute;
}

export async function listAuditEvents() {
  const state = await readState();
  return state.auditEvents;
}

export async function createAuditEvent(input: Partial<AuditEvent>) {
  const state = await readState();
  const timestamp = formatTimestamp();
  const event: AuditEvent = {
    id: input.id ?? nextAuditId(state.auditEvents),
    dealId: input.dealId ?? "DEAL-UNKNOWN",
    type: input.type ?? "Manual Event",
    actor: input.actor ?? "TradeLock Operator",
    asset: input.asset ?? "0.00 USDC",
    status: input.status ?? "Confirmed",
    block: input.block ?? `${24570000 + state.auditEvents.length + 1}`,
    timestamp,
    txHash: input.txHash ?? buildTxHash(),
    proofHash: input.proofHash,
    proofFile: input.proofFile,
  };

  state.auditEvents = [event, ...state.auditEvents];
  await writeState(state);

  return event;
}

export async function listCounterparties() {
  const state = await readState();
  return syncCounterparties(state.counterparties, state.deals);
}

export async function upsertCounterparty(input: Counterparty) {
  const state = await readState();
  const index = state.counterparties.findIndex((entry) => entry.company === input.company);

  if (index === -1) {
    state.counterparties = [...state.counterparties, input];
  } else {
    state.counterparties[index] = {
      ...state.counterparties[index],
      ...input,
    };
  }

  state.counterparties = syncCounterparties(state.counterparties, state.deals);
  await writeState(state);

  return state.counterparties.find((entry) => entry.company === input.company) ?? input;
}

export async function upsertCounterparties(inputs: Counterparty[]) {
  const state = await readState();

  for (const input of inputs) {
    const index = state.counterparties.findIndex((entry) => entry.company === input.company);

    if (index === -1) {
      state.counterparties.push(input);
    } else {
      state.counterparties[index] = {
        ...state.counterparties[index],
        ...input,
      };
    }
  }

  state.counterparties = syncCounterparties(state.counterparties, state.deals);
  await writeState(state);

  return state.counterparties;
}

export async function listSettings() {
  const state = await readState();
  return state.settings;
}

export async function updateSettings(patch: Partial<SettingsState>) {
  const state = await readState();
  state.settings = {
    ...state.settings,
    ...patch,
  };
  await writeState(state);
  return state.settings;
}

export async function getPersistenceStatus() {
  const supabase = await getSupabaseStoreHealth();

  if (supabase.available) {
    return {
      activeStore: "supabase" as const,
      healthy: true,
      detail: supabase.detail,
    };
  }

  return {
    activeStore: "unavailable" as const,
    healthy: false,
    detail: `Supabase persistence is unavailable: ${supabase.detail}`,
  };
}
