"use client";

import { ArrowRight, CheckCircle2, ExternalLink, FileSearch2, GitBranch, Globe2, Network, Route, Scale, ShieldAlert, Users2, Wallet, type LucideIcon } from "lucide-react";

import { getAddressExplorerUrl, getTxExplorerUrl, shortenHash } from "@/lib/explorer";
import { settlementTokenSymbol } from "@/lib/settlement-token";
import { getEscrowContractAddress, getSettlementTokenAddress } from "@/lib/tradelock-web3";
import type { ServiceHealth } from "@/lib/types";
import { useTradeLockData } from "@/components/tradelock-data-provider";
import { ActionButton, MobilePageHeader, Panel, StatusBadge, SummaryRow } from "@/components/tradelock-ui";

type JudgeScreenProps = {
  onOpenDashboard: () => void;
  onOpenDisputes: () => void;
  onOpenAudit: () => void;
  onOpenCounterparties: () => void;
};

const pitchDeckPath = "/pitchdeck/tradelock-pitchdeck.html";
const pitchDeckPdfPath = "/pitchdeck/tradelock-pitchdeck.pdf";
const githubRepoUrl = "https://github.com/clawhubs/Tradelock";

const reviewSteps = [
  {
    title: "1. Start with live state",
    body: "Open Dashboard and verify active wallets, custody activity, recent deals, and the Selected Deal panel.",
  },
  {
    title: "2. Follow an escrow lifecycle",
    body: "Inspect deal creation, funding, proof upload, proof verification, release, and dispute paths from Deals and Audit Trail.",
  },
  {
    title: "3. Review arbitration mapping",
    body: "Use Disputes to connect buyer, seller, evidence files, frozen amount, transaction hash, and resolution status.",
  },
  {
    title: "4. Check infrastructure claims",
    body: "Confirm QStash schedules, Upstash Redis, Supabase state, Pinata/IPFS proofs, and Arbitrum Sepolia contract activity.",
  },
];

const settlementTokenNote = "tUSD is a test settlement token used for repeatable hackathon escrow activity on Arbitrum Sepolia. The same contract flow can support USDC.";

const architectureNodes = [
  ["QStash", "Schedules recurring market activity and daily wallet growth."],
  ["Custodial Engine", "Creates managed wallets, funds flows, and writes latest custody state."],
  ["Supabase", "Durable app state for deals, disputes, audit events, and settings."],
  ["Upstash Redis", "Fast custody registry/cache used by automation and UI refresh."],
  ["Pinata/IPFS", "Proof documents are pinned and linked into the audit trail."],
  ["Escrow + tUSD", "Solidity settlement path on Arbitrum Sepolia using test settlement asset."],
];

const endToEndFlow: Array<[string, string, LucideIcon]> = [
  ["Buyer", "Funds escrow with test tUSD", Globe2],
  ["Escrow", "Locks settlement on Arbitrum Sepolia", Network],
  ["Seller", "Uploads proof to IPFS", FileSearch2],
  ["Judge", "Reviews evidence and disputes", Scale],
  ["Release", "Funds settle or dispute remains frozen", GitBranch],
];

function compactHash(value?: string) {
  if (!value) return "Not available";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function JudgeView({
  mode,
  onOpenDashboard,
  onOpenDisputes,
  onOpenAudit,
  onOpenCounterparties,
}: JudgeScreenProps & { mode: "desktop" | "mobile" }) {
  const { data, custodySnapshot, systemStatus } = useTradeLockData();
  const latestDeal = data.deals[0];
  const latestDispute = data.disputes[0];
  const latestAuditEvent = data.auditEvents[0];
  const openDisputes = data.disputes.filter((dispute) => dispute.status !== "Resolved" && dispute.status !== "Archived");
  const verifiedEvents = data.auditEvents.filter((event) => event.status === "Verified" || event.status === "Finalized").length;
  const buyerCount = data.counterparties.filter((entry) => entry.role === "Buyer").length;
  const sellerCount = data.counterparties.filter((entry) => entry.role === "Seller").length;
  const escrowContractAddress = getEscrowContractAddress();
  const contractUrl = getAddressExplorerUrl(escrowContractAddress);
  const latestTxHash = latestAuditEvent?.txHash ?? latestDeal?.txHash ?? latestDispute?.txHash;
  const latestTxUrl = getTxExplorerUrl(latestTxHash);
  const lastSyncedLabel = custodySnapshot?.recentActivity[0]?.createdAt ?? latestAuditEvent?.timestamp ?? latestDeal?.updated ?? latestDispute?.updated;
  const settlementTokenAddress = getSettlementTokenAddress();
  const settlementTokenUrl = getAddressExplorerUrl(settlementTokenAddress);
  const custodyPoolUrl = getAddressExplorerUrl(custodySnapshot?.poolAddress);
  const services: Array<[string, ServiceHealth | undefined]> = [
    ["Supabase", systemStatus.services.supabase],
    ["Redis", systemStatus.services.redis],
    ["Pinata", systemStatus.services.pinata],
    ["QStash", systemStatus.services.qstash],
    ["Custody", systemStatus.services.custody],
  ];
  const isMobile = mode === "mobile";

  return (
    <div className={isMobile ? "space-y-5" : "space-y-4"}>
      {isMobile && (
        <MobilePageHeader
          title="Judge Mode"
          description="A guided review map for demo flow, wallets, disputes, proofs, and architecture."
        />
      )}

      <Panel className="overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative grid gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
              <Scale className="h-3.5 w-3.5" />
              Hackathon review cockpit
            </div>
            <h2 className={`display-font mt-4 font-semibold leading-tight tracking-[-0.04em] text-white ${isMobile ? "text-[1.8rem]" : "text-[2rem] xl:text-[3.15rem]"}`}>
              Everything judges need to verify TradeLock in one place.
            </h2>
            <p className={`mt-3 max-w-3xl text-slate-300 ${isMobile ? "text-[13px] leading-5" : "text-sm leading-6 xl:text-[15px]"}`}>
              Judge Mode maps the live escrow workspace from problem, solution, custody automation, counterparties, disputes, and proof trails into a single guided route. No guessing which screen proves which claim.
            </p>
            <div className={`mt-5 flex flex-wrap gap-2 ${isMobile ? "pb-1" : ""}`}>
              <ActionButton tone="blue" label="Open Dashboard" icon={Route} small onClick={onOpenDashboard} />
              <ActionButton tone="orange" label="Review Disputes" icon={ShieldAlert} small outlined onClick={onOpenDisputes} />
              <ActionButton tone="cyan" label="Audit Trail" icon={FileSearch2} small outlined onClick={onOpenAudit} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Managed wallets" value={String(custodySnapshot?.activeWallets ?? custodySnapshot?.totalWallets ?? data.counterparties.length)} detail="buyers, sellers, arbitrators" icon={Wallet} />
            <MetricCard label="Counterparty map" value={`${buyerCount} / ${sellerCount}`} detail="buyers / sellers" icon={Users2} />
            <MetricCard label="Open disputes" value={String(openDisputes.length)} detail="evidence-linked review items" icon={ShieldAlert} />
            <MetricCard label="Verified events" value={String(verifiedEvents)} detail="audit trail confirmations" icon={CheckCircle2} />
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Panel title="Judge Review Map">
            <div className="grid gap-3 md:grid-cols-2">
              {reviewSteps.map((step) => (
                <div key={step.title} className="rounded-[12px] border border-white/[0.08] bg-white/[0.025] p-4">
                  <div className="font-semibold text-white">{step.title}</div>
                  <p className="mt-2 text-[13px] leading-5 text-slate-400">{step.body}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Counterparty And Dispute Mapping" action={<button type="button" onClick={onOpenCounterparties} className="text-[11px] text-blue-300 hover:text-blue-200">Open counterparties</button>}>
            <div className="data-scroll overflow-auto rounded-[10px] border border-white/[0.08]">
              <table className="min-w-[900px] text-left text-[12px]">
                <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Wallet</th>
                    <th className="px-4 py-3 font-medium">Deals</th>
                    <th className="px-4 py-3 font-medium">Trust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.counterparties.slice(0, 8).map((entry) => (
                    <tr key={entry.company} className="transition hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-medium text-white">{entry.company}</td>
                      <td className="px-4 py-3">{entry.role}</td>
                      <td className="px-4 py-3">{entry.location}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-cyan-200">{entry.wallet}</td>
                      <td className="px-4 py-3">{entry.totalDeals}</td>
                      <td className="px-4 py-3">{entry.trustScore}/100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Architecture Map">
            <div className="grid gap-3 md:grid-cols-3">
              {architectureNodes.map(([title, body], index) => (
                <div key={title} className="relative rounded-[12px] border border-blue-400/15 bg-blue-500/[0.055] p-4">
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400 text-[12px] font-bold text-slate-950">
                    {index + 1}
                  </div>
                  <div className="font-semibold text-white">{title}</div>
                  <p className="mt-2 text-[12px] leading-5 text-slate-400">{body}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Arbitrum Sepolia Contracts">
            <div className="space-y-3 text-sm">
              <div className="rounded-[12px] border border-white/[0.08] bg-white/[0.025] p-4 text-[13px] leading-5 text-slate-400">
                {settlementTokenNote}
              </div>
              <div className="space-y-3 rounded-[12px] border border-white/[0.08] bg-white/[0.02] p-4">
                <SummaryRow
                  label="Escrow Contract"
                  value={
                    contractUrl && escrowContractAddress ? (
                      <a href={contractUrl} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
                        {shortenHash(escrowContractAddress)}
                      </a>
                    ) : (
                      escrowContractAddress ? shortenHash(escrowContractAddress) : "Not configured"
                    )
                  }
                />
                <SummaryRow
                  label="tUSD Contract"
                  value={
                    settlementTokenUrl && settlementTokenAddress ? (
                      <a href={settlementTokenUrl} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
                        {shortenHash(settlementTokenAddress)}
                      </a>
                    ) : (
                      settlementTokenAddress ? shortenHash(settlementTokenAddress) : "Not configured"
                    )
                  }
                />
                <SummaryRow
                  label="Custody Pool Wallet"
                  value={
                    custodyPoolUrl && custodySnapshot?.poolAddress ? (
                      <a href={custodyPoolUrl} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
                        {shortenHash(custodySnapshot.poolAddress)}
                      </a>
                    ) : (
                      custodySnapshot?.poolAddress ? shortenHash(custodySnapshot.poolAddress) : "Not available"
                    )
                  }
                />
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Latest Live Evidence" action={latestDeal ? <StatusBadge status={latestDeal.status} compact /> : undefined}>
            <div className="space-y-3 text-sm">
              <SummaryRow
                label="Contract"
                value={
                  contractUrl && escrowContractAddress ? (
                    <a href={contractUrl} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
                      {shortenHash(escrowContractAddress)}
                    </a>
                  ) : (
                    escrowContractAddress ? shortenHash(escrowContractAddress) : "Not configured"
                  )
                }
              />
              <SummaryRow
                label="Latest TX"
                value={
                  latestTxUrl && latestTxHash ? (
                    <a href={latestTxUrl} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
                      {shortenHash(latestTxHash)}
                    </a>
                  ) : (
                    latestTxHash ? shortenHash(latestTxHash) : "N/A"
                  )
                }
              />
              <SummaryRow label="Latest Deal" value={latestDeal?.id ?? "No deal loaded"} emphasized />
              <SummaryRow label="Latest Dispute" value={latestDispute?.id ?? "No dispute yet"} />
              <SummaryRow label="Buyer" value={latestDeal?.buyer ?? "N/A"} />
              <SummaryRow label="Seller" value={latestDeal?.seller ?? "N/A"} />
              <SummaryRow label="Amount" value={latestDeal?.amount ?? `0.00 ${settlementTokenSymbol}`} emphasized />
              <SummaryRow label="Proof" value={latestDeal?.proofHash ?? "N/A"} />
              <SummaryRow label="Last Synced" value={lastSyncedLabel ?? "N/A"} />
              <ActionButton tone="blue" label="Open Audit Evidence" icon={ArrowRight} small onClick={onOpenAudit} />
            </div>
          </Panel>

          <Panel title="Service Health">
            <div className="space-y-2.5">
              {services.map(([label, service]) => (
                <div key={label} className="flex items-start justify-between gap-3 rounded-[10px] border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
                  <div>
                    <div className="text-[12px] font-medium text-white">{label}</div>
                    <div className="mt-1 line-clamp-2 text-[11px] text-slate-500">{service?.detail ?? "Not checked yet."}</div>
                  </div>
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${service?.healthy ? "bg-emerald-400" : service?.configured ? "bg-amber-400" : "bg-slate-500"}`} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Pitch Deck">
            <div className="space-y-3 text-sm">
              <a href={githubRepoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-between rounded-[10px] border border-blue-400/25 bg-blue-500/10 px-3 py-3 text-blue-100 transition hover:bg-blue-500/15">
                Open GitHub repository
                <ExternalLink className="h-4 w-4" />
              </a>
              <p className="text-slate-400">
                The deck explains the trust problem, TradeLock solution, architecture, live demo map, and roadmap in a judge-friendly format.
              </p>
              <div className="grid gap-2">
                <a href={pitchDeckPath} target="_blank" rel="noreferrer" className="inline-flex items-center justify-between rounded-[10px] border border-cyan-400/25 bg-cyan-500/10 px-3 py-3 text-cyan-100 transition hover:bg-cyan-500/15">
                  Open HTML deck
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a href={pitchDeckPdfPath} target="_blank" rel="noreferrer" className="inline-flex items-center justify-between rounded-[10px] border border-white/[0.1] bg-white/[0.03] px-3 py-3 text-slate-200 transition hover:bg-white/[0.055]">
                  Open PDF deck
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel title="End-to-End Flow">
        <div className="grid gap-3 md:grid-cols-5">
          {endToEndFlow.map(([title, body, Icon]) => (
            <div key={String(title)} className="rounded-[12px] border border-white/[0.08] bg-white/[0.025] p-4">
              <Icon className="h-5 w-5 text-cyan-300" />
              <div className="mt-3 font-semibold text-white">{title}</div>
              <p className="mt-2 text-[12px] leading-5 text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[14px] border border-white/[0.09] bg-white/[0.035] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{label}</div>
          <div className="display-font mt-2 text-[2rem] font-semibold leading-none text-white">{value}</div>
          <div className="mt-2 text-[12px] text-slate-400">{detail}</div>
        </div>
        <div className="rounded-[10px] border border-cyan-400/20 bg-cyan-500/10 p-2.5">
          <Icon className="h-5 w-5 text-cyan-300" />
        </div>
      </div>
    </div>
  );
}

export function JudgeDesktopScreen(props: JudgeScreenProps) {
  return <JudgeView mode="desktop" {...props} />;
}

export function JudgeMobileScreen(props: JudgeScreenProps) {
  return <JudgeView mode="mobile" {...props} />;
}
