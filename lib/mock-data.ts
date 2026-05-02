import type {
  AuditEvent,
  Counterparty,
  Deal,
  Dispute,
  FeatureCard,
  NavItem,
  ScreenKey,
  SettingsCard,
  StatCard,
  TimelineItem,
} from "@/lib/types";
import { settlementTokenSymbol, withSettlementTokenSymbol } from "@/lib/settlement-token";

function parseAmount(value: string) {
  return Number(value.replace(/[^0-9.]/g, ""));
}

function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

const counterpartyDirectory = {
  "GlobalImport Ltd.": {
    handle: "@globalimport",
    role: "Buyer" as const,
    location: "Singapore",
    trustScore: 98,
    status: "Trusted" as const,
    wallet: "0x7a83...c2F9",
  },
  "Dubai Trade LLC": {
    handle: "@dubaitrade",
    role: "Buyer" as const,
    location: "UAE",
    trustScore: 95,
    status: "Trusted" as const,
    wallet: "0x0C19...1Bb2",
  },
  "Quality Works GmbH": {
    handle: "@qualityworks",
    role: "Buyer" as const,
    location: "Germany",
    trustScore: 93,
    status: "Verified" as const,
    wallet: "0x8E61...c819",
  },
  "Shenzhen Parts Co.": {
    handle: "@shenzhenparts",
    role: "Seller" as const,
    location: "China",
    trustScore: 97,
    status: "Trusted" as const,
    wallet: "0x8349...9A22",
  },
  "Ningbo Tech Ltd.": {
    handle: "@ningbotech",
    role: "Seller" as const,
    location: "China",
    trustScore: 94,
    status: "Verified" as const,
    wallet: "0x9182...0D44",
  },
};

export const navItems: NavItem[] = [
  { key: "judge", label: "Judge Mode", shortLabel: "Judge" },
  { key: "dashboard", label: "Dashboard", shortLabel: "Home" },
  { key: "deals", label: "Deals", shortLabel: "Deals" },
  { key: "create", label: "Create Deal", shortLabel: "Create" },
  { key: "disputes", label: "Disputes", shortLabel: "Disputes" },
  { key: "audit", label: "Audit Trail", shortLabel: "Audit" },
  { key: "counterparties", label: "Counterparties", shortLabel: "Parties" },
  { key: "settings", label: "Settings", shortLabel: "Settings" },
];

export const dealFilters = ["All Deals", "Active", "Waiting Proof", "Ready to Release", "Disputed", "Completed"];
export const disputeFilters = ["All", "Under Review", "Evidence Submitted", "Escalated", "Resolved", "Archived"];
export const auditFilters = ["All Events", "Deal Created", "Deposit Funded", "Proof Uploaded", "Proof Verified", "Funds Released", "Dispute Events"];
export const counterpartyFilters = ["All", "Buyers", "Sellers", "Trusted", "Recently Active"];

export const deals: Deal[] = [
  {
    id: "DEAL-7F3A",
    buyer: "GlobalImport Ltd.",
    buyerLocation: "Singapore",
    seller: "Shenzhen Parts Co.",
    sellerLocation: "China",
    amount: "5,000.00 USDC",
    amountRaw: "5,000.00",
    milestone: "Quality Inspection & Packaging",
    progress: "2/3",
    proofStatus: "Proof Verified",
    status: "Ready to Release",
    network: "Arbitrum Sepolia",
    updated: "May 16, 2025 10:30 AM",
    proofFile: "PackingList.pdf",
    txHash: "0x2a3b...5f01",
    proofHash: "Qm7f3a...proof",
  },
  {
    id: "DEAL-6E15",
    buyer: "Dubai Trade LLC",
    buyerLocation: "UAE",
    seller: "Ningbo Tech Ltd.",
    sellerLocation: "China",
    amount: "3,200.00 USDC",
    amountRaw: "3,200.00",
    milestone: "Factory Inspection",
    progress: "1/3",
    proofStatus: "Proof Verified",
    status: "Proof Verified",
    network: "Arbitrum Sepolia",
    updated: "May 15, 2025 09:15 AM",
    proofFile: "InspectionNote.pdf",
    txHash: "0x6e15...2c44",
    proofHash: "Qm6e15...proof",
  },
  {
    id: "DEAL-4D81",
    buyer: "Dubai Trade LLC",
    buyerLocation: "UAE",
    seller: "Ningbo Tech Ltd.",
    sellerLocation: "China",
    amount: "12,800.00 USDC",
    amountRaw: "12,800.00",
    milestone: "Escrow Funding Confirmed",
    progress: "2/3",
    proofStatus: "Submitted",
    status: "Funded",
    network: "Arbitrum Sepolia",
    updated: "May 13, 2025 04:45 PM",
    proofFile: "ShipmentManifest.pdf",
    txHash: "0x4d81...91ac",
    proofHash: "Qm4d81...proof",
  },
  {
    id: "DEAL-34EF",
    buyer: "Quality Works GmbH",
    buyerLocation: "Germany",
    seller: "Shenzhen Parts Co.",
    sellerLocation: "China",
    amount: "4,315.00 USDC",
    amountRaw: "4,315.00",
    milestone: "Final Settlement",
    progress: "3/3",
    proofStatus: "Proof Verified",
    status: "Completed",
    network: "Arbitrum Sepolia",
    updated: "May 12, 2025 11:22 AM",
    proofFile: "CompletionCert.pdf",
    txHash: "0x34ef...77b2",
    proofHash: "Qm34ef...proof",
  },
  {
    id: "DEAL-3C5E",
    buyer: "Quality Works GmbH",
    buyerLocation: "Germany",
    seller: "Shenzhen Parts Co.",
    sellerLocation: "China",
    amount: "2,940.00 USDC",
    amountRaw: "2,940.00",
    milestone: "Quality Issue Review",
    progress: "1/3",
    proofStatus: "Submitted",
    status: "Disputed",
    network: "Arbitrum Sepolia",
    updated: "May 15, 2025 02:12 PM",
    proofFile: "DamagePhotos.zip",
    txHash: "0x3c5e...44fa",
    proofHash: "Qm3c5e...proof",
  },
  {
    id: "DEAL-2B90",
    buyer: "GlobalImport Ltd.",
    buyerLocation: "Singapore",
    seller: "Shenzhen Parts Co.",
    sellerLocation: "China",
    amount: "8,450.00 USDC",
    amountRaw: "8,450.00",
    milestone: "Pre-shipment Confirmation",
    progress: "1/2",
    proofStatus: "Waiting Proof",
    status: "Waiting Proof",
    network: "Arbitrum Sepolia",
    updated: "May 14, 2025 08:40 AM",
    proofFile: "AwaitingUpload",
    txHash: "0x2b90...cc08",
    proofHash: "Pending",
  },
  {
    id: "DEAL-1A77",
    buyer: "Dubai Trade LLC",
    buyerLocation: "UAE",
    seller: "Ningbo Tech Ltd.",
    sellerLocation: "China",
    amount: "6,780.00 USDC",
    amountRaw: "6,780.00",
    milestone: "Packing Confirmation",
    progress: "1/3",
    proofStatus: "Submitted",
    status: "Active",
    network: "Arbitrum Sepolia",
    updated: "May 14, 2025 06:10 PM",
    proofFile: "PackingSlip.pdf",
    txHash: "0x1a77...52ce",
    proofHash: "Qm1a77...proof",
  },
];

for (const deal of deals) {
  deal.amount = withSettlementTokenSymbol(deal.amount);
}

export const disputes: Dispute[] = [
  {
    id: "DISPUTE-3C5E",
    dealId: "DEAL-3C5E",
    buyer: "Quality Works GmbH",
    seller: "Shenzhen Parts Co.",
    amount: "2,940.00 USDC",
    reason: "Quality issue raised",
    evidenceStatus: "Evidence Submitted",
    status: "Under Review",
    updated: "May 15, 2025 02:12 PM",
    evidenceFiles: ["damage_photos.zip", "inspection_note.pdf"],
    txHash: "0x3c5e...88d1",
  },
  {
    id: "DISPUTE-4D81",
    dealId: "DEAL-4D81",
    buyer: "Dubai Trade LLC",
    seller: "Ningbo Tech Ltd.",
    amount: "4,200.00 USDC",
    reason: "Short shipment / missing items",
    evidenceStatus: "Evidence Submitted",
    status: "Evidence Submitted",
    updated: "May 14, 2025 04:18 PM",
    evidenceFiles: ["short_shipment_photos.zip"],
    txHash: "0x4d81...ab10",
  },
  {
    id: "DISPUTE-34EF",
    dealId: "DEAL-34EF",
    buyer: "Quality Works GmbH",
    seller: "Shenzhen Parts Co.",
    amount: "1,850.00 USDC",
    reason: "Final proof confirmation requested",
    evidenceStatus: "Verified",
    status: "Resolved",
    updated: "May 12, 2025 01:07 PM",
    evidenceFiles: ["completion_cert.pdf", "buyer_approval.txt"],
    txHash: "0x34ef...ff22",
  },
];

for (const dispute of disputes) {
  dispute.amount = withSettlementTokenSymbol(dispute.amount);
}

export const auditEvents: AuditEvent[] = [
  {
    id: "EVT-91A2",
    dealId: "DEAL-7F3A",
    type: "Deal Created",
    actor: "GlobalImport Ltd.",
    asset: "Contract deployed",
    status: "Verified",
    block: "24567811",
    timestamp: "May 16, 2025 10:20 AM",
    txHash: "0xb2...9f01",
  },
  {
    id: "EVT-91B7",
    dealId: "DEAL-7F3A",
    type: "Deposit Funded",
    actor: "Buyer Wallet",
    asset: "5,000.00 USDC",
    status: "Verified",
    block: "24567845",
    timestamp: "May 16, 2025 10:28 AM",
    txHash: "0x7d...2a31",
  },
  {
    id: "EVT-91D4",
    dealId: "DEAL-7F3A",
    type: "Proof Uploaded",
    actor: "Shenzhen Parts Co.",
    asset: "PackingList.pdf",
    status: "Verified",
    block: "24567918",
    timestamp: "May 16, 2025 10:25 AM",
    txHash: "0x9e...7b71",
    proofHash: "Qm7f3a...proof",
    proofFile: "PackingList.pdf",
  },
  {
    id: "EVT-91E9",
    dealId: "DEAL-7F3A",
    type: "Proof Verified",
    actor: "GlobalImport Ltd.",
    asset: "IPFS Qm7f3a...proof",
    status: "Verified",
    block: "24567984",
    timestamp: "May 16, 2025 10:30 AM",
    txHash: "0x9f3a...b7c1e2d3",
    proofHash: "Qm7f3a...proof",
    proofFile: "PackingList.pdf",
  },
  {
    id: "EVT-9201",
    dealId: "DEAL-7F3A",
    type: "Ready to Release",
    actor: "Buyer Approved",
    asset: "Milestone 2/3",
    status: "Verified",
    block: "24568012",
    timestamp: "May 12, 2025 09:50 AM",
    txHash: "0x3a...d1f1",
  },
  {
    id: "EVT-9228",
    dealId: "DEAL-3C5E",
    type: "Dispute Opened",
    actor: "Quality Works GmbH",
    asset: "DamagePhotos.zip",
    status: "Under Review",
    block: "24568103",
    timestamp: "May 15, 2025 02:12 PM",
    txHash: "0x1f...fe53",
  },
  {
    id: "EVT-9241",
    dealId: "DEAL-34EF",
    type: "Funds Released",
    actor: "Smart Contract",
    asset: "4,315.00 USDC",
    status: "Finalized",
    block: "24568220",
    timestamp: "May 12, 2025 11:22 AM",
    txHash: "0xaf...cc38",
  },
];

for (const event of auditEvents) {
  event.asset = withSettlementTokenSymbol(event.asset);
}

export const counterparties: Counterparty[] = Object.entries(counterpartyDirectory).map(([company, profile]) => {
  const relatedDeals = deals.filter((deal) => deal.buyer === company || deal.seller === company);
  const totalVolume = relatedDeals.reduce((sum, deal) => sum + parseAmount(deal.amountRaw), 0);
  const latestDeal = [...relatedDeals].sort(
    (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime(),
  )[0];

  return {
    company,
    handle: profile.handle,
    role: profile.role,
    location: profile.location,
    trustScore: profile.trustScore,
    totalDeals: relatedDeals.length,
    escrowVolume: formatUsd(totalVolume),
    lastDeal: latestDeal ? latestDeal.updated : "N/A",
    status: profile.status,
    wallet: profile.wallet,
  };
});

const totalEscrowVolume = deals.reduce((sum, deal) => sum + parseAmount(deal.amountRaw), 0);
const activeDealsCount = deals.filter((deal) => deal.status !== "Completed").length;
const pendingReleaseVolume = deals
  .filter((deal) => deal.status === "Ready to Release")
  .reduce((sum, deal) => sum + parseAmount(deal.amountRaw), 0);
const disputesOpenCount = disputes.filter((dispute) => dispute.status === "Under Review" || dispute.status === "Evidence Submitted").length;

export const overviewStats: StatCard[] = [
  { label: "Active Deals", value: formatCount(activeDealsCount), change: "Across all current flows", tone: "blue" },
  { label: "Escrow Volume", value: `${formatUsd(totalEscrowVolume)} ${settlementTokenSymbol}`, change: "Unified with deal list", tone: "green" },
  { label: "Pending Release", value: `${formatUsd(pendingReleaseVolume)} ${settlementTokenSymbol}`, change: "Ready to settle", tone: "purple" },
  { label: "Disputes Open", value: formatCount(disputesOpenCount), change: "Needs review", tone: "orange" },
];

export const dealsStats: StatCard[] = [
  { label: "Total Deals", value: formatCount(deals.length), change: "Synced with dashboard rows", tone: "blue" },
  {
    label: "Active Deals",
    value: formatCount(deals.filter((deal) => ["Active", "Waiting Proof", "Proof Verified", "Funded", "Ready to Release"].includes(deal.status)).length),
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

export const disputesStats: StatCard[] = [
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

export const auditStats: StatCard[] = [
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

export const counterpartyStats: StatCard[] = [
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

export const dashboardTimeline: TimelineItem[] = [
  { title: "Deal Created", subtitle: "May 10, 2025", status: "done" },
  { title: "Funded", subtitle: "May 10, 2025", status: "done" },
  { title: "Proof Submitted", subtitle: "May 12, 2025", status: "done" },
  { title: "Proof Verified", subtitle: "May 12, 2025", status: "done" },
  { title: "Ready to Release", subtitle: "Pending", status: "current" },
  { title: "Funds Released", subtitle: "Pending", status: "pending" },
];

export const createSteps = [
  "Counterparty",
  "Deal Type",
  "Amount & Asset",
  "Milestones",
  "Proof Requirements",
  "Dispute Rule",
  "Review & Create",
];

export const createFields = [
  { label: "Buyer Company", value: "GlobalImport Ltd." },
  { label: "Country", value: "Singapore" },
  { label: "Wallet Address", value: "0x8AB3...32e" },
  { label: "Contact Email", value: "procurement@globalimport.com" },
  { label: "Seller Company", value: "Shenzhen Parts Co." },
  { label: "Country", value: "China" },
  { label: "Wallet Address", value: "0x8349...9A22" },
  { label: "Contact Email", value: "ops@shenzhenparts.co" },
];

export const settingsCards: SettingsCard[] = [
  {
    id: "organization",
    title: "1. Organization Profile",
    lines: ["TradeLock Operations", "Business ID TLK-882312", "Cross-border escrow desk", "Verification Status: Verified"],
    action: "Edit Profile",
  },
  {
    id: "team",
    title: "2. Team & Roles",
    lines: ["12 active members", "Arun Mehta - Admin", "Sophia Chen - Finance Manager", "Lina Park - Viewer"],
    action: "Manage Team",
  },
  {
    id: "wallet",
    title: "3. Wallet & Network",
    lines: ["Default Asset: Settlement token", "Default Network: Arbitrum Sepolia", "Connected Wallet: Managed from live session"],
    action: "Manage Wallets",
  },
  {
    id: "security",
    title: "4. Security & Access",
    lines: ["Two-Factor Authentication Enabled", "Login Alerts Enabled", "Session Timeout 30 min", "IP Whitelist: 3 entries"],
    action: "Manage Security",
  },
  {
    id: "notifications",
    title: "5. Notifications",
    lines: ["Email Notifications Enabled", "Slack Notifications Enabled", "Webhook Notifications Enabled", "Digest Frequency: Daily"],
    action: "Configure Alerts",
  },
  {
    id: "dispute-rules",
    title: "7. Dispute Preferences",
    lines: ["Escalation Timeline: 7 days", "Evidence Submission: Required", "Escalation Rules: Default", "Default Arbiter: TradeLock Panel"],
    action: "Edit Rules",
  },
];

export const screenFeatures: Record<ScreenKey, FeatureCard[]> = {
  judge: [
    { title: "Guided Demo Review", subtitle: "Every claim mapped", tone: "blue" },
    { title: "Counterparty Mapping", subtitle: "Wallets, roles, trust", tone: "cyan" },
    { title: "Dispute Evidence", subtitle: "Frozen funds visible", tone: "orange" },
    { title: "Architecture Trace", subtitle: "QStash to contracts", tone: "purple" },
    { title: "Proof Trail", subtitle: "IPFS and audit links", tone: "green" },
    { title: "Judge-ready Deck", subtitle: "HTML and PDF pitch", tone: "blue" },
  ],
  dashboard: [
    { title: "Smart Contract Powered", subtitle: "Immutable & Automated", tone: "blue" },
    { title: "Non-custodial & Transparent", subtitle: "Funds stay verifiable", tone: "cyan" },
    { title: "Gasless Experience", subtitle: "Sponsored transactions", tone: "green" },
    { title: "On-chain Audit Trail", subtitle: "Every action recorded", tone: "purple" },
    { title: "Cross-border B2B Ready", subtitle: "Built for global trade", tone: "orange" },
    { title: "Built on Arbitrum", subtitle: "Fast, secure, low cost", tone: "blue" },
  ],
  deals: [
    { title: "Smart Contract Powered", subtitle: "Immutable & Automated", tone: "blue" },
    { title: "Real-time Deal Tracking", subtitle: "Live status & updates", tone: "cyan" },
    { title: "On-chain Audit Trail", subtitle: "Transparent & verifiable", tone: "green" },
    { title: "Proof Verification", subtitle: "Secure & tamper-proof", tone: "purple" },
    { title: "Cross-border B2B Ready", subtitle: "Global by design", tone: "orange" },
    { title: "Built on Arbitrum", subtitle: "Fast, secure, low cost", tone: "blue" },
  ],
  create: [
    { title: "Smart Contract Powered", subtitle: "Structured escrow logic", tone: "blue" },
    { title: "Gasless UX", subtitle: "Sponsored transactions", tone: "cyan" },
    { title: "On-chain Proof", subtitle: "Immutable & verifiable", tone: "green" },
    { title: "Dispute Resolution", subtitle: "Transparent & fair", tone: "purple" },
    { title: "Cross-border B2B", subtitle: "Global by design", tone: "orange" },
    { title: "Built on Arbitrum", subtitle: "Fast, secure, low cost", tone: "blue" },
  ],
  disputes: [
    { title: "Smart Contract Powered", subtitle: "Immutable & Automated", tone: "blue" },
    { title: "Structured Resolution Flow", subtitle: "Clear steps, fair outcomes", tone: "cyan" },
    { title: "On-chain Evidence Trail", subtitle: "Tamper-proof & verifiable", tone: "green" },
    { title: "Transparent Arbitration", subtitle: "Escalate with confidence", tone: "purple" },
    { title: "Cross-border B2B Ready", subtitle: "Global by design", tone: "orange" },
    { title: "Built on Arbitrum", subtitle: "Fast, secure, low cost", tone: "blue" },
  ],
  audit: [
    { title: "Immutable Event Logs", subtitle: "Transparent & tamper-proof", tone: "blue" },
    { title: "Proof Verification", subtitle: "IPFS-backed & verifiable", tone: "cyan" },
    { title: "Arbitrum Finality", subtitle: "Fast settlement records", tone: "green" },
    { title: "Exportable Audit Trail", subtitle: "CSV & explorer links", tone: "purple" },
    { title: "Cross-border B2B Ready", subtitle: "Global by design", tone: "orange" },
    { title: "Built on Arbitrum", subtitle: "Fast, secure, low cost", tone: "blue" },
  ],
  counterparties: [
    { title: "Verified Business Profiles", subtitle: "KYC-ready & authentic", tone: "blue" },
    { title: "Trust Score & Reputation", subtitle: "Transparent ratings & reviews", tone: "cyan" },
    { title: "Global Trading Network", subtitle: "Connect across borders", tone: "green" },
    { title: "On-chain Deal History", subtitle: "Immutable & verifiable", tone: "purple" },
    { title: "Cross-border B2B Ready", subtitle: "Global by design", tone: "orange" },
    { title: "Built on Arbitrum", subtitle: "Fast, secure, low cost", tone: "blue" },
  ],
  settings: [
    { title: "Business Controls", subtitle: "Govern your workspace", tone: "blue" },
    { title: "Team Permissions", subtitle: "Granular roles & access", tone: "cyan" },
    { title: "Secure Wallet Setup", subtitle: "Multi-wallet & network", tone: "green" },
    { title: "Alert Preferences", subtitle: "Email, Slack & Webhooks", tone: "purple" },
    { title: "Arbitration Rules", subtitle: "Escalation & resolution", tone: "orange" },
    { title: "Built on Arbitrum", subtitle: "Fast, secure, low cost", tone: "blue" },
  ],
};
