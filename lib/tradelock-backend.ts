import {
  auditFilters,
  counterpartyFilters,
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
import { settlementTokenSymbol, withSettlementTokenSymbol } from "@/lib/settlement-token";
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
const appTimeZone = "Asia/Jakarta";

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
    timeZone: appTimeZone,
  })
    .format(date)
    .replace(",", "")
    .replace(" at ", " ");
}

function formatAmount(amountRaw: string) {
  const value = Number(amountRaw.replace(/,/g, ""));
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${settlementTokenSymbol}`;
}

function parseDisplayTimestamp(value?: string | null) {
  if (!value || value === "N/A") {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function compareText(a: string, b: string) {
  return a.localeCompare(b, "en-US", { sensitivity: "base" });
}

function parseAutoSequence(value?: string | null) {
  if (!value) {
    return 0;
  }

  const [, encoded] = value.split("-");

  if (!encoded) {
    return 0;
  }

  const sequence = Number.parseInt(encoded, 36);
  return Number.isNaN(sequence) ? 0 : sequence;
}

function formatAutoTimestamp(value?: string | null) {
  const sequence = parseAutoSequence(value);

  if (!sequence) {
    return null;
  }

  return formatTimestamp(new Date(sequence));
}

function sortDealsByUpdated(deals: Deal[]) {
  return [...deals].sort((a, b) => {
    const byAutoSequence = parseAutoSequence(b.id) - parseAutoSequence(a.id);

    if (byAutoSequence !== 0) {
      return byAutoSequence;
    }

    const byUpdated = parseDisplayTimestamp(b.updated) - parseDisplayTimestamp(a.updated);

    if (byUpdated !== 0) {
      return byUpdated;
    }

    return compareText(b.id, a.id);
  });
}

function sortDisputesByUpdated(disputes: Dispute[]) {
  return [...disputes].sort((a, b) => {
    const byDealSequence = parseAutoSequence(b.dealId) - parseAutoSequence(a.dealId);

    if (byDealSequence !== 0) {
      return byDealSequence;
    }

    const byUpdated = parseDisplayTimestamp(b.updated) - parseDisplayTimestamp(a.updated);

    if (byUpdated !== 0) {
      return byUpdated;
    }

    return compareText(b.id, a.id);
  });
}

function sortAuditEventsByTimestamp(events: AuditEvent[]) {
  return [...events].sort((a, b) => {
    const byDealSequence = parseAutoSequence(b.dealId) - parseAutoSequence(a.dealId);

    if (byDealSequence !== 0) {
      return byDealSequence;
    }

    const byTimestamp = parseDisplayTimestamp(b.timestamp) - parseDisplayTimestamp(a.timestamp);

    if (byTimestamp !== 0) {
      return byTimestamp;
    }

    return compareText(b.id, a.id);
  });
}

function sortCounterpartiesByLastDeal(counterparties: Counterparty[], deals: Deal[]) {
  const dealRank = new Map<string, number>();

  deals.forEach((deal, index) => {
    dealRank.set(deal.id, index);
  });

  return [...counterparties].sort((a, b) => {
    const latestDealA = deals.find((deal) => deal.buyer === a.company || deal.seller === a.company);
    const latestDealB = deals.find((deal) => deal.buyer === b.company || deal.seller === b.company);
    const rankA = latestDealA ? (dealRank.get(latestDealA.id) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
    const rankB = latestDealB ? (dealRank.get(latestDealB.id) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
    const byLastDeal = rankA - rankB;

    if (byLastDeal !== 0) {
      return byLastDeal;
    }

    const byDeals = b.totalDeals - a.totalDeals;

    if (byDeals !== 0) {
      return byDeals;
    }

    return compareText(a.company, b.company);
  });
}

function buildCounterpartyEmail(label: string) {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return `${slug.slice(0, 18)}@tradelock.demo`;
}

function buildCreateFields(counterparties: Counterparty[], deals: Deal[]) {
  const recentDeal = deals[0];
  const buyers = counterparties.filter((entry) => entry.role === "Buyer");
  const sellers = counterparties.filter((entry) => entry.role === "Seller");
  const buyer = buyers.find((entry) => entry.company === recentDeal?.buyer) ?? buyers[0];
  const seller = sellers.find((entry) => entry.company === recentDeal?.seller) ?? sellers[0];

  return [
    { label: "Buyer Company", value: buyer?.company ?? "No active buyer yet" },
    { label: "Buyer Country", value: buyer?.location ?? "Not available" },
    { label: "Buyer Wallet", value: buyer?.wallet ?? "Not assigned" },
    { label: "Buyer Handle", value: buyer?.handle ?? buildCounterpartyEmail("buyer") },
    { label: "Seller Company", value: seller?.company ?? "No active seller yet" },
    { label: "Seller Country", value: seller?.location ?? "Not available" },
    { label: "Seller Wallet", value: seller?.wallet ?? "Not assigned" },
    { label: "Seller Handle", value: seller?.handle ?? buildCounterpartyEmail("seller") },
  ];
}

function normalizePersistedState(state: PersistedState): PersistedState {
  return {
    ...state,
    deals: state.deals.map((deal) => ({
      ...deal,
      amount: withSettlementTokenSymbol(deal.amount),
      updated: formatAutoTimestamp(deal.id) ?? deal.updated,
    })),
    disputes: state.disputes.map((dispute) => ({
      ...dispute,
      amount: withSettlementTokenSymbol(dispute.amount),
      updated: formatAutoTimestamp(dispute.dealId) ?? dispute.updated,
    })),
    auditEvents: state.auditEvents.map((event) => ({
      ...event,
      asset: withSettlementTokenSymbol(event.asset),
      timestamp: formatAutoTimestamp(event.dealId) ?? event.timestamp,
    })),
  };
}

async function writeState(state: PersistedState) {
  const ok = await writeSupabaseState(state);

  if (!ok) {
    throw new Error("Unable to persist state to Supabase.");
  }

  await invalidateAppStateCache();
}

async function readState(): Promise<PersistedState> {
  const state = await ensureSupabaseInitialized(createDefaultState());
  return normalizePersistedState(state);
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

export async function resetAppStateCache() {
  await invalidateAppStateCache();
}

function syncCounterparties(counterparties: Counterparty[], deals: Deal[]) {
  return counterparties.map((entry) => {
    const relatedDeals = deals.filter((deal) => deal.buyer === entry.company || deal.seller === entry.company);
    const totalVolume = relatedDeals.reduce((sum, deal) => sum + parseAmount(deal.amountRaw), 0);
    const latestDeal = relatedDeals[0];

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
    { label: "Escrow Volume", value: `${formatUsd(totalEscrowVolume)} ${settlementTokenSymbol}`, change: "Unified with deal list", tone: "green" },
    { label: "Pending Release", value: `${formatUsd(pendingReleaseVolume)} ${settlementTokenSymbol}`, change: "Ready to settle", tone: "purple" },
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
    { label: "Total Escrow Volume", value: `${formatUsd(totalEscrowVolume)} ${settlementTokenSymbol}`, change: "Same source as dashboard", tone: "blue" },
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
      value: `${formatUsd(disputes.filter((dispute) => dispute.status !== "Resolved").reduce((sum, dispute) => sum + parseAmount(dispute.amount), 0))} ${settlementTokenSymbol}`,
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
  const deals = sortDealsByUpdated(state.deals);
  const disputes = sortDisputesByUpdated(state.disputes);
  const auditEvents = sortAuditEventsByTimestamp(state.auditEvents);
  const counterparties = sortCounterpartiesByLastDeal(syncCounterparties(state.counterparties, deals), deals);
  const appState: TradeLockAppState = {
    dealFilters,
    disputeFilters,
    auditFilters,
    counterpartyFilters,
    deals,
    disputes,
    auditEvents,
    counterparties,
    overviewStats: buildOverviewStats(deals, disputes),
    dealsStats: buildDealsStats(deals),
    disputesStats: buildDisputeStats(disputes),
    auditStats: buildAuditStats(auditEvents),
    counterpartyStats: buildCounterpartyStats(counterparties),
    createSteps,
    createFields: buildCreateFields(counterparties, deals),
    settings: state.settings,
  };

  await writeAppStateCache(appState);

  return appState;
}

export async function listDeals() {
  const state = await readState();
  return sortDealsByUpdated(state.deals);
}

export async function getDeal(id: string) {
  const state = await readState();
  return state.deals.find((deal) => deal.id === id) ?? null;
}

export async function createDeal(input: DealInput = {}) {
  const state = await readState();
  const id = input.id ?? nextDealId(state.deals);
  const buyers = state.counterparties.filter((entry) => entry.role === "Buyer");
  const sellers = state.counterparties.filter((entry) => entry.role === "Seller");
  const selectedBuyer = buyers[0];
  const selectedSeller =
    sellers.find((entry) => entry.location !== selectedBuyer?.location) ?? sellers[0];
  const amountRaw = input.amountRaw ?? "25,000.00";
  const timestamp = formatTimestamp();
  const txHash = input.txHash ?? "";

  const newDeal: Deal = {
    id,
    buyer: input.buyer ?? selectedBuyer?.company ?? "Unassigned Buyer",
    buyerLocation: input.buyerLocation ?? selectedBuyer?.location ?? "Unknown",
    seller: input.seller ?? selectedSeller?.company ?? "Unassigned Seller",
    sellerLocation: input.sellerLocation ?? selectedSeller?.location ?? "Unknown",
    amount: formatAmount(amountRaw),
    amountRaw,
    milestone: input.milestone ?? "Awaiting token approval",
    progress: input.progress ?? "0/3",
    proofStatus: input.proofStatus ?? "Waiting Proof",
    status: input.status ?? "Active",
    network: input.network ?? "Arbitrum Sepolia",
    updated: timestamp,
    proofFile: input.proofFile ?? "Pending upload",
    txHash,
    proofHash: input.proofHash ?? "",
  };

  const auditEvent: AuditEvent = {
    id: nextAuditId(state.auditEvents),
    dealId: newDeal.id,
    type: "Deal Created",
    actor: newDeal.buyer,
    asset: newDeal.amount,
    status: "Confirmed",
    block: input.txHash ? `${24570000 + state.auditEvents.length + 1}` : "Pending",
    timestamp,
    txHash,
    proofHash: newDeal.proofHash,
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
  return sortDisputesByUpdated(state.disputes);
}

export async function createDispute(input: Partial<Dispute>) {
  const state = await readState();
  const timestamp = formatTimestamp();
  const dispute: Dispute = {
    id: input.id ?? nextDisputeId(state.disputes),
    dealId: input.dealId ?? "DEAL-UNKNOWN",
    buyer: input.buyer ?? "Unknown Buyer",
    seller: input.seller ?? "Unknown Seller",
    amount: withSettlementTokenSymbol(input.amount ?? "0.00 tUSD"),
    reason: input.reason ?? "Manual dispute created",
    evidenceStatus: input.evidenceStatus ?? "Evidence Submitted",
    status: input.status ?? "Under Review",
    updated: timestamp,
    evidenceFiles: input.evidenceFiles ?? [],
    txHash: input.txHash ?? "",
  };

  state.disputes = [dispute, ...state.disputes];
  await writeState(state);

  return dispute;
}

export async function listAuditEvents() {
  const state = await readState();
  return sortAuditEventsByTimestamp(state.auditEvents);
}

export async function createAuditEvent(input: Partial<AuditEvent>) {
  const state = await readState();
  const timestamp = formatTimestamp();
  const event: AuditEvent = {
    id: input.id ?? nextAuditId(state.auditEvents),
    dealId: input.dealId ?? "DEAL-UNKNOWN",
    type: input.type ?? "Manual Event",
    actor: input.actor ?? "TradeLock Operator",
    asset: withSettlementTokenSymbol(input.asset ?? "0.00 tUSD"),
    status: input.status ?? "Confirmed",
    block: input.block ?? "Pending",
    timestamp,
    txHash: input.txHash ?? "",
    proofHash: input.proofHash,
    proofFile: input.proofFile,
  };

  state.auditEvents = [event, ...state.auditEvents];
  await writeState(state);

  return event;
}

export async function listCounterparties() {
  const state = await readState();
  const deals = sortDealsByUpdated(state.deals);
  return sortCounterpartiesByLastDeal(syncCounterparties(state.counterparties, deals), deals);
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
