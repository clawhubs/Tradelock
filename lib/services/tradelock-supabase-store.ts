import type { Counterparty, Deal, Dispute, SettingsState, SummaryItem, AuditEvent } from "@/lib/types";
import { getSupabaseAdminClient } from "@/lib/services/supabase";
import type { PersistedState } from "@/lib/tradelock-default-state";

type SupabaseSettingsRow = {
  id: string;
  cards: unknown;
  workspace_summary: unknown;
  security_summary: unknown;
};

type SupabaseDealRow = {
  id: string;
  buyer: string;
  buyer_location: string;
  seller: string;
  seller_location: string;
  amount: string;
  amount_raw: string;
  milestone: string;
  progress: string;
  proof_status: string;
  status: string;
  network: string;
  updated: string;
  proof_file: string;
  tx_hash: string;
  proof_hash: string;
};

type SupabaseDisputeRow = {
  id: string;
  deal_id: string;
  buyer: string;
  seller: string;
  amount: string;
  reason: string;
  evidence_status: string;
  status: string;
  updated: string;
  evidence_files: string[];
  tx_hash: string;
};

type SupabaseAuditRow = {
  id: string;
  deal_id: string;
  type: string;
  actor: string;
  asset: string;
  status: string;
  block: string;
  timestamp: string;
  tx_hash: string;
  proof_hash?: string | null;
  proof_file?: string | null;
};

type SupabaseCounterpartyRow = {
  company: string;
  handle: string;
  role: "Buyer" | "Seller";
  location: string;
  trust_score: number;
  total_deals: number;
  escrow_volume: string;
  last_deal: string;
  status: string;
  wallet: string;
};

let tableAvailability: { checkedAt: number; ok: boolean; detail: string } | null = null;

function asJsonArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function defaultSettings(): SettingsState {
  return {
    cards: [],
    workspaceSummary: [],
    securitySummary: [],
  };
}

function toDeal(row: SupabaseDealRow): Deal {
  return {
    id: row.id,
    buyer: row.buyer,
    buyerLocation: row.buyer_location,
    seller: row.seller,
    sellerLocation: row.seller_location,
    amount: row.amount,
    amountRaw: row.amount_raw,
    milestone: row.milestone,
    progress: row.progress,
    proofStatus: row.proof_status as Deal["proofStatus"],
    status: row.status as Deal["status"],
    network: row.network,
    updated: row.updated,
    proofFile: row.proof_file,
    txHash: row.tx_hash,
    proofHash: row.proof_hash,
  };
}

function fromDeal(deal: Deal): SupabaseDealRow {
  return {
    id: deal.id,
    buyer: deal.buyer,
    buyer_location: deal.buyerLocation,
    seller: deal.seller,
    seller_location: deal.sellerLocation,
    amount: deal.amount,
    amount_raw: deal.amountRaw,
    milestone: deal.milestone,
    progress: deal.progress,
    proof_status: deal.proofStatus,
    status: deal.status,
    network: deal.network,
    updated: deal.updated,
    proof_file: deal.proofFile,
    tx_hash: deal.txHash,
    proof_hash: deal.proofHash,
  };
}

function toDispute(row: SupabaseDisputeRow): Dispute {
  return {
    id: row.id,
    dealId: row.deal_id,
    buyer: row.buyer,
    seller: row.seller,
    amount: row.amount,
    reason: row.reason,
    evidenceStatus: row.evidence_status as Dispute["evidenceStatus"],
    status: row.status as Dispute["status"],
    updated: row.updated,
    evidenceFiles: Array.isArray(row.evidence_files) ? row.evidence_files : [],
    txHash: row.tx_hash,
  };
}

function fromDispute(dispute: Dispute): SupabaseDisputeRow {
  return {
    id: dispute.id,
    deal_id: dispute.dealId,
    buyer: dispute.buyer,
    seller: dispute.seller,
    amount: dispute.amount,
    reason: dispute.reason,
    evidence_status: dispute.evidenceStatus,
    status: dispute.status,
    updated: dispute.updated,
    evidence_files: dispute.evidenceFiles,
    tx_hash: dispute.txHash,
  };
}

function toAuditEvent(row: SupabaseAuditRow): AuditEvent {
  return {
    id: row.id,
    dealId: row.deal_id,
    type: row.type,
    actor: row.actor,
    asset: row.asset,
    status: row.status as AuditEvent["status"],
    block: row.block,
    timestamp: row.timestamp,
    txHash: row.tx_hash,
    proofHash: row.proof_hash ?? undefined,
    proofFile: row.proof_file ?? undefined,
  };
}

function fromAuditEvent(event: AuditEvent): SupabaseAuditRow {
  return {
    id: event.id,
    deal_id: event.dealId,
    type: event.type,
    actor: event.actor,
    asset: event.asset,
    status: event.status,
    block: event.block,
    timestamp: event.timestamp,
    tx_hash: event.txHash,
    proof_hash: event.proofHash,
    proof_file: event.proofFile,
  };
}

function toCounterparty(row: SupabaseCounterpartyRow): Counterparty {
  return {
    company: row.company,
    handle: row.handle,
    role: row.role,
    location: row.location,
    trustScore: row.trust_score,
    totalDeals: row.total_deals,
    escrowVolume: row.escrow_volume,
    lastDeal: row.last_deal,
    status: row.status as Counterparty["status"],
    wallet: row.wallet,
  };
}

function fromCounterparty(entry: Counterparty): SupabaseCounterpartyRow {
  return {
    company: entry.company,
    handle: entry.handle,
    role: entry.role,
    location: entry.location,
    trust_score: entry.trustScore,
    total_deals: entry.totalDeals,
    escrow_volume: entry.escrowVolume,
    last_deal: entry.lastDeal,
    status: entry.status,
    wallet: entry.wallet,
  };
}

export async function getSupabaseStoreHealth() {
  const client = getSupabaseAdminClient();

  if (!client) {
    return { available: false, detail: "Supabase client not configured." };
  }

  const now = Date.now();

  if (tableAvailability && now - tableAvailability.checkedAt < 60_000) {
    return { available: tableAvailability.ok, detail: tableAvailability.detail };
  }

  try {
    const { error } = await client.from("deals").select("id", { head: true, count: "exact" });

    if (error) {
      tableAvailability = {
        checkedAt: now,
        ok: false,
        detail: error.message,
      };
      return { available: false, detail: error.message };
    }

    tableAvailability = {
      checkedAt: now,
      ok: true,
      detail: "Supabase tables reachable.",
    };
    return { available: true, detail: "Supabase tables reachable." };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown Supabase store error.";
    tableAvailability = {
      checkedAt: now,
      ok: false,
      detail,
    };
    return { available: false, detail };
  }
}

export async function readSupabaseState(): Promise<PersistedState | null> {
  const client = getSupabaseAdminClient();

  if (!client) {
    return null;
  }

  const health = await getSupabaseStoreHealth();

  if (!health.available) {
    return null;
  }

  try {
    const [dealsResult, disputesResult, auditResult, counterpartiesResult, settingsResult] = await Promise.all([
      client.from("deals").select("*").order("updated", { ascending: false }),
      client.from("disputes").select("*").order("updated", { ascending: false }),
      client.from("audit_events").select("*").order("timestamp", { ascending: false }),
      client.from("counterparties").select("*").order("company", { ascending: true }),
      client.from("settings").select("*").eq("id", "default").maybeSingle<SupabaseSettingsRow>(),
    ]);

    if (dealsResult.error || disputesResult.error || auditResult.error || counterpartiesResult.error || settingsResult.error) {
      return null;
    }

    const settingsRow = settingsResult.data;

    if ((dealsResult.data?.length ?? 0) === 0 && (counterpartiesResult.data?.length ?? 0) === 0 && !settingsRow) {
      return null;
    }

    return {
      deals: ((dealsResult.data ?? []) as SupabaseDealRow[]).map(toDeal),
      disputes: ((disputesResult.data ?? []) as SupabaseDisputeRow[]).map(toDispute),
      auditEvents: ((auditResult.data ?? []) as SupabaseAuditRow[]).map(toAuditEvent),
      counterparties: ((counterpartiesResult.data ?? []) as SupabaseCounterpartyRow[]).map(toCounterparty),
      settings: settingsRow
        ? {
            cards: asJsonArray(settingsRow.cards, []),
            workspaceSummary: asJsonArray<SummaryItem>(settingsRow.workspace_summary, []),
            securitySummary: asJsonArray<SummaryItem>(settingsRow.security_summary, []),
          }
        : defaultSettings(),
    };
  } catch {
    return null;
  }
}

export async function writeSupabaseState(state: PersistedState) {
  const client = getSupabaseAdminClient();

  if (!client) {
    return false;
  }

  const health = await getSupabaseStoreHealth();

  if (!health.available) {
    return false;
  }

  try {
    const operations = [
      client.from("deals").upsert(state.deals.map(fromDeal), { onConflict: "id" }),
      client.from("disputes").upsert(state.disputes.map(fromDispute), { onConflict: "id" }),
      client.from("audit_events").upsert(state.auditEvents.map(fromAuditEvent), { onConflict: "id" }),
      client.from("counterparties").upsert(state.counterparties.map(fromCounterparty), { onConflict: "company" }),
      client.from("settings").upsert(
        {
          id: "default",
          cards: state.settings.cards,
          workspace_summary: state.settings.workspaceSummary,
          security_summary: state.settings.securitySummary,
        },
        { onConflict: "id" },
      ),
    ];

    const results = await Promise.all(operations);
    return results.every((result) => !result.error);
  } catch {
    return false;
  }
}

export async function ensureSupabaseInitialized(defaultState: PersistedState) {
  const existing = await readSupabaseState();

  if (existing) {
    return existing;
  }

  const health = await getSupabaseStoreHealth();

  if (!health.available) {
    throw new Error(health.detail);
  }

  const initialized = await writeSupabaseState(defaultState);

  if (!initialized) {
    throw new Error("Supabase write failed while initializing default state.");
  }

  const nextState = await readSupabaseState();

  if (!nextState) {
    throw new Error("Supabase initialization completed but no state could be read back.");
  }

  return nextState;
}
