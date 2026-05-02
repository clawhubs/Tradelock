export type ScreenKey =
  | "judge"
  | "dashboard"
  | "deals"
  | "create"
  | "disputes"
  | "audit"
  | "counterparties"
  | "settings";

export type ToneKey =
  | "blue"
  | "green"
  | "purple"
  | "orange"
  | "cyan"
  | "red"
  | "slate";

export type StatusKey =
  | "Ready to Release"
  | "Proof Verified"
  | "Funded"
  | "Completed"
  | "Waiting Proof"
  | "Submitted"
  | "Active"
  | "Disputed"
  | "Under Review"
  | "Evidence Submitted"
  | "Resolved"
  | "Archived"
  | "Verified"
  | "Finalized"
  | "Trusted"
  | "Business Verified"
  | "Low Risk"
  | "Frozen in escrow"
  | "Confirmed";

export interface NavItem {
  key: ScreenKey;
  label: string;
  shortLabel: string;
}

export interface StatCard {
  label: string;
  value: string;
  change: string;
  tone: ToneKey;
}

export interface Deal {
  id: string;
  buyer: string;
  buyerLocation: string;
  seller: string;
  sellerLocation: string;
  amount: string;
  amountRaw: string;
  milestone: string;
  progress: string;
  proofStatus: StatusKey;
  status: StatusKey;
  network: string;
  updated: string;
  proofFile: string;
  txHash: string;
  proofHash: string;
}

export interface Dispute {
  id: string;
  dealId: string;
  buyer: string;
  seller: string;
  amount: string;
  reason: string;
  evidenceStatus: StatusKey;
  status: StatusKey;
  updated: string;
  evidenceFiles: string[];
  txHash: string;
}

export interface AuditEvent {
  id: string;
  dealId: string;
  type: string;
  actor: string;
  asset: string;
  status: StatusKey;
  block: string;
  timestamp: string;
  txHash: string;
  proofHash?: string;
  proofFile?: string;
}

export interface Counterparty {
  company: string;
  handle: string;
  role: "Buyer" | "Seller";
  location: string;
  trustScore: number;
  totalDeals: number;
  escrowVolume: string;
  lastDeal: string;
  status: StatusKey;
  wallet: string;
}

export interface FeatureCard {
  title: string;
  subtitle: string;
  tone: ToneKey;
}

export interface TimelineItem {
  title: string;
  subtitle: string;
  status: "done" | "current" | "pending" | "alert";
}

export interface SettingsCard {
  id: string;
  title: string;
  lines: string[];
  action: string;
}

export interface SummaryItem {
  label: string;
  value: string;
}

export interface CreateField {
  label: string;
  value: string;
}

export interface SettingsState {
  cards: SettingsCard[];
  workspaceSummary: SummaryItem[];
  securitySummary: SummaryItem[];
}

export interface TradeLockAppState {
  dealFilters: string[];
  disputeFilters: string[];
  auditFilters: string[];
  counterpartyFilters: string[];
  deals: Deal[];
  disputes: Dispute[];
  auditEvents: AuditEvent[];
  counterparties: Counterparty[];
  overviewStats: StatCard[];
  dealsStats: StatCard[];
  disputesStats: StatCard[];
  auditStats: StatCard[];
  counterpartyStats: StatCard[];
  createSteps: string[];
  createFields: CreateField[];
  settings: SettingsState;
}

export interface ServiceHealth {
  configured: boolean;
  healthy: boolean;
  detail: string;
}

export interface PersistenceHealth {
  activeStore: "supabase" | "unavailable";
  healthy: boolean;
  detail: string;
}

export interface SystemStatus {
  services: {
    redis: ServiceHealth;
    pinata: ServiceHealth;
    supabase: ServiceHealth;
    persistence: PersistenceHealth;
    custody?: ServiceHealth;
    qstash?: ServiceHealth;
  };
}

export interface WalletState {
  address?: string;
  shortAddress: string;
  chainId?: number;
  chainName: string;
  nativeBalance: string;
  settlementBalance: string;
  settlementSymbol: string;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  contractAddress?: string;
  contractReady: boolean;
  connectionLabel: string;
}

export interface CustodyActivityItem {
  id: string;
  createdAt: string;
  type: "bootstrap" | "funding" | "daily-user" | "activity" | "dispute";
  summary: string;
  dealId?: string;
  txHashes: string[];
}

export interface CustodyWalletSummary {
  id: string;
  address: string;
  role: "Buyer" | "Seller" | "Arbitrator";
  company: string;
  countryName: string;
  active: boolean;
  source: "imported" | "generated";
  balances?: {
    eth: string;
    tusd: string;
    updatedAt: string;
  };
}

export interface CustodySnapshot {
  totalWallets: number;
  activeWallets: number;
  buyers: number;
  activeBuyers: number;
  sellers: number;
  activeSellers: number;
  arbitrators: number;
  activeArbitrators: number;
  poolAddress: string;
  poolEthBalance?: string;
  poolTusdBalance?: string;
  dailyUserStartDate: string;
  lastDailyUserDate?: string | null;
  activityIntervalSeconds: number;
  recentActivity: CustodyActivityItem[];
  activeWalletRows: CustodyWalletSummary[];
}
