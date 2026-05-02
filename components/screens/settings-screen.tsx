"use client";

import { motion } from "framer-motion";
import {
  Bell,
  Building2,
  ChevronRight,
  Copy,
  FileSearch2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Users2,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { useTradeLockData } from "@/components/tradelock-data-provider";
import { ActionButton, ArbitrumBadge, Panel, SettingsTile, StatusBadge, SummaryRow } from "@/components/tradelock-ui";
import { downloadCsv } from "@/lib/browser-export";

export function SettingsDesktopScreen() {
  const { data, systemStatus, custodySnapshot, walletState, connectWallet, disconnectWallet, switchWalletNetwork, isWalletBusy } = useTradeLockData();
  const { settings } = data;
  const liveSettingsCards = [
    {
      id: "organization",
      title: "1. Organization Profile",
      lines: [
        "TradeLock Operations",
        `Managed Wallets: ${custodySnapshot?.activeWallets ?? 0}`,
        `Counterparties: ${data.counterparties.length}`,
        `Verification Status: ${settings.workspaceSummary[0]?.value ?? "Verified"}`,
      ],
      action: "View Live Status",
    },
    {
      id: "team",
      title: "2. Team & Roles",
      lines: [
        `Buyers: ${custodySnapshot?.activeBuyers ?? 0}`,
        `Sellers: ${custodySnapshot?.activeSellers ?? 0}`,
        `Arbitrators: ${custodySnapshot?.activeArbitrators ?? 0}`,
        `Recent Activity Items: ${custodySnapshot?.recentActivity.length ?? 0}`,
      ],
      action: "Review Activity",
    },
    {
      id: "wallet",
      title: "3. Wallet & Network",
      lines: [
        `Settlement Asset: ${walletState.settlementSymbol}`,
        `Default Network: ${walletState.chainName}`,
        `Connected Wallet: ${walletState.shortAddress}`,
        `Escrow Contract: ${walletState.contractReady ? "Configured" : "Pending"}`,
      ],
      action: "Manage Wallets",
    },
    {
      id: "security",
      title: "4. Security & Access",
      lines: [
        `Custody Engine: ${systemStatus.services.custody?.healthy ? "Healthy" : "Pending"}`,
        `Redis Cache: ${systemStatus.services.redis.healthy ? "Healthy" : "Unavailable"}`,
        `Supabase Store: ${systemStatus.services.supabase.healthy ? "Healthy" : "Unavailable"}`,
        `QStash Schedules: ${systemStatus.services.qstash?.healthy ? "Active" : "Unavailable"}`,
      ],
      action: "Review Controls",
    },
    {
      id: "notifications",
      title: "5. Notifications",
      lines: [
        `Live Feed Items: ${custodySnapshot?.recentActivity.length ?? 0}`,
        `Auto Refresh: every 30 seconds`,
        `Daily User Start: ${custodySnapshot?.dailyUserStartDate ?? "Not scheduled"}`,
        `Latest Persistence: ${systemStatus.services.persistence.activeStore}`,
      ],
      action: "Inspect Automation",
    },
    {
      id: "dispute-rules",
      title: "6. Dispute Preferences",
      lines: [
        `Open Disputes: ${data.disputes.filter((dispute) => dispute.status !== "Resolved").length}`,
        `Proof-linked Events: ${data.auditEvents.filter((event) => event.proofHash || event.proofFile).length}`,
        `Pool ETH: ${custodySnapshot?.poolEthBalance ?? "0"} ETH`,
        `Pool tUSD: ${custodySnapshot?.poolTusdBalance ?? "0"} tUSD`,
      ],
      action: "Review Escrow Health",
    },
  ];

  function exportSettingsCsv() {
    downloadCsv(
      "tradelock-settings.csv",
      ["Section", "Label", "Value"],
      [
        ...settings.workspaceSummary.map((item) => ["Workspace", item.label, item.value]),
        ...settings.securitySummary.map((item) => ["Security", item.label, item.value]),
        ["Services", "Persistence", systemStatus.services.persistence.activeStore],
        ["Services", "Redis", systemStatus.services.redis.healthy ? "Healthy" : "Unavailable"],
        ["Services", "Pinata", systemStatus.services.pinata.healthy ? "Healthy" : "Unavailable"],
        ["Services", "Supabase", systemStatus.services.supabase.healthy ? "Healthy" : "Unavailable"],
        ["Wallet", "Account", walletState.shortAddress],
        ["Wallet", "Network", walletState.chainName],
        ["Wallet", "Settlement Balance", `${walletState.settlementBalance} ${walletState.settlementSymbol}`],
        ["Custody", "Active Wallets", `${custodySnapshot?.activeWallets ?? 0}`],
        ["Custody", "Pool ETH", `${custodySnapshot?.poolEthBalance ?? "0"} ETH`],
        ["Custody", "Pool tUSD", `${custodySnapshot?.poolTusdBalance ?? "0"} tUSD`],
      ],
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid gap-4 md:grid-cols-2">
        {liveSettingsCards.map((card) => (
          <SettingsTile key={card.id} card={card} />
        ))}
      </div>

      <div className="space-y-3 self-start xl:sticky xl:top-4">
        <Panel title="Workspace Summary" action={<StatusBadge status="Business Verified" compact />}>
          <div className="space-y-4 text-sm">
            {settings.workspaceSummary.map((item) => (
              <SummaryRow key={item.label} label={item.label} value={item.value} />
            ))}
            <div className="grid gap-3 pt-2">
              <ActionButton tone="blue" label="Export Settings" icon={Upload} onClick={exportSettingsCsv} />
            </div>
          </div>
        </Panel>
        <Panel title="Security Posture">
          <div className="space-y-3 text-sm">
            {settings.securitySummary.map((item) => (
              <SummaryRow key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        </Panel>
        <Panel title="Backend Services">
          <div className="space-y-3 text-sm">
            <SummaryRow label="Persistence" value={systemStatus.services.persistence.activeStore} />
            <SummaryRow label="Persistence Detail" value={systemStatus.services.persistence.detail} stacked />
            <SummaryRow label="Redis" value={systemStatus.services.redis.healthy ? "Healthy" : "Unavailable"} />
            <SummaryRow label="Pinata" value={systemStatus.services.pinata.healthy ? "Healthy" : "Unavailable"} />
            <SummaryRow label="Supabase" value={systemStatus.services.supabase.healthy ? "Healthy" : "Unavailable"} />
            <SummaryRow label="Custody" value={systemStatus.services.custody?.healthy ? "Healthy" : "Unavailable"} />
            <SummaryRow label="QStash" value={systemStatus.services.qstash?.healthy ? "Healthy" : "Unavailable"} />
          </div>
        </Panel>
        {custodySnapshot && (
          <Panel title="Custodial Wallets">
            <div className="space-y-3 text-sm">
              <SummaryRow label="Active Wallets" value={`${custodySnapshot.activeWallets}`} />
              <SummaryRow label="Active Buyers" value={`${custodySnapshot.activeBuyers}`} />
              <SummaryRow label="Active Sellers" value={`${custodySnapshot.activeSellers}`} />
              <SummaryRow label="Arbitrators" value={`${custodySnapshot.activeArbitrators}`} />
              <SummaryRow label="Pool ETH" value={`${custodySnapshot.poolEthBalance ?? "0"} ETH`} />
              <SummaryRow label="Pool tUSD" value={`${custodySnapshot.poolTusdBalance ?? "0"} tUSD`} />
              <SummaryRow label="Daily User Start" value={custodySnapshot.dailyUserStartDate} />
            </div>
            <div className="mt-4 space-y-2 border-t border-white/[0.08] pt-4 text-sm">
              {custodySnapshot.activeWalletRows.slice(0, 6).map((wallet) => (
                <SummaryRow
                  key={wallet.id}
                  label={`${wallet.company} (${wallet.role})`}
                  value={`${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
                  stacked
                />
              ))}
            </div>
          </Panel>
        )}
        <Panel title="Wallet & Contract">
          <div className="space-y-3 text-sm">
            <SummaryRow label="Account" value={walletState.shortAddress} />
            <SummaryRow label="Network" value={walletState.chainName} />
            <SummaryRow label="Gas Balance" value={`${walletState.nativeBalance} ETH`} />
            <SummaryRow label="Settlement Balance" value={`${walletState.settlementBalance} ${walletState.settlementSymbol}`} />
            <SummaryRow label="Escrow Contract" value={walletState.contractReady ? "Configured" : "Pending"} />
            {!walletState.isConnected ? (
              <ActionButton tone="blue" label={isWalletBusy ? "Connecting..." : walletState.connectionLabel} icon={Wallet} small disabled={isWalletBusy} onClick={() => void connectWallet()} />
            ) : !walletState.isCorrectNetwork ? (
              <ActionButton tone="orange" label={isWalletBusy ? "Switching..." : "Switch Network"} icon={Wallet} small disabled={isWalletBusy} onClick={() => void switchWalletNetwork()} />
            ) : (
              <ActionButton tone="slate" label="Disconnect Wallet" icon={Wallet} small onClick={disconnectWallet} />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

type ProfileTile = { icon: LucideIcon; label: string; description: string };

export function SettingsMobileScreen() {
  const { data, systemStatus, custodySnapshot, walletState, connectWallet, disconnectWallet, switchWalletNetwork, isWalletBusy } = useTradeLockData();
  const featuredWallet = custodySnapshot?.activeWalletRows[0];
  const featuredInitials = featuredWallet
    ? featuredWallet.company
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("")
    : "TL";
  const accountItems: ProfileTile[] = [
    { icon: Building2, label: "Organization", description: `${data.settings.workspaceSummary[0]?.value ?? "Verified"} · ${custodySnapshot?.activeWallets ?? 0} managed wallets` },
    { icon: Users2, label: "Counterparties", description: `${data.counterparties.length} live profiles · ${custodySnapshot?.activeBuyers ?? 0} buyers / ${custodySnapshot?.activeSellers ?? 0} sellers` },
    { icon: FileSearch2, label: "Audit Trail", description: `${data.auditEvents.length} on-chain event records` },
  ];
  const preferenceItems: ProfileTile[] = [
    { icon: Shield, label: "Security", description: systemStatus.services.custody?.healthy ? "Custody healthy, encrypted wallet store" : "Custody checks pending" },
    { icon: Bell, label: "Notifications", description: `${custodySnapshot?.recentActivity.length ?? 0} recent activity item(s) in live feed` },
    { icon: ShieldAlert, label: "Dispute Rules", description: `${data.disputes.filter((dispute) => dispute.status !== "Resolved").length} open dispute(s) under review` },
  ];

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-[20px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(37,99,235,0.22)_0%,rgba(109,40,217,0.14)_50%,rgba(8,18,42,0.85)_100%)] p-5"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-blue-500/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-10 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />
        <div className="pointer-events-none absolute inset-x-[20%] top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(120,170,255,0.5),transparent)]" />
        <div className="relative flex items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-blue-400/40 bg-[linear-gradient(135deg,#1e56dc,#103ea7)] text-[1.45rem] font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,0.45)]">
            {featuredInitials}
            <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-[#020b1a] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="display-font text-[1.2rem] font-semibold leading-tight text-white">{featuredWallet?.company ?? "TradeLock Operations"}</div>
            <div className="text-[11px] text-slate-400">{featuredWallet ? `${featuredWallet.role} · ${featuredWallet.countryName}` : "Custodial network operator"}</div>
            <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold tracking-widest text-emerald-300">
              <ShieldCheck className="h-2.5 w-2.5" />
              VERIFIED BUSINESS
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="overflow-hidden rounded-[18px] border border-white/[0.08] bg-white/[0.025]"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-3.5 w-3.5 text-blue-300" />
            <span className="text-[12px] font-semibold text-white">Connected Wallet</span>
          </div>
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-widest ${
              walletState.isConnected
                ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                : "border border-slate-400/20 bg-white/[0.04] text-slate-400"
            }`}
          >
            <span className={`h-1 w-1 rounded-full ${walletState.isConnected ? "animate-pulse bg-emerald-400" : "bg-slate-500"}`} />
            {walletState.isConnected ? "CONNECTED" : "IDLE"}
          </span>
        </div>
        <div className="space-y-2 p-3">
          <div className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-500">Wallet Address</div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <code className="font-mono text-[12px] font-medium text-white">{walletState.shortAddress}</code>
              <button
                type="button"
                aria-label="Copy address"
                onClick={() => {
                  if (walletState.address) {
                    void navigator.clipboard.writeText(walletState.address);
                  }
                }}
                className="text-slate-400 transition hover:text-white"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-2.5">
              <div className="text-[9px] uppercase tracking-widest text-slate-500">Network</div>
              <div className="mt-1 flex items-center gap-1.5">
                <ArbitrumBadge size={12} />
                <span className="text-[11px] font-semibold text-white">{walletState.chainName}</span>
              </div>
            </div>
            <div className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-2.5">
              <div className="text-[9px] uppercase tracking-widest text-slate-500">Balance</div>
              <div className="mt-1 text-[11px] font-semibold text-white">
                {walletState.settlementBalance} {walletState.settlementSymbol}
              </div>
            </div>
          </div>
          {!walletState.isConnected ? (
            <button
              type="button"
              onClick={() => void connectWallet()}
              disabled={isWalletBusy}
              className="w-full rounded-[10px] border border-blue-500/25 bg-blue-500/[0.08] py-2.5 text-[12px] font-semibold text-blue-200 transition active:scale-[0.98] hover:bg-blue-500/[0.12] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isWalletBusy ? "Connecting..." : walletState.connectionLabel}
            </button>
          ) : !walletState.isCorrectNetwork ? (
            <button
              type="button"
              onClick={() => void switchWalletNetwork()}
              disabled={isWalletBusy}
              className="w-full rounded-[10px] border border-amber-500/25 bg-amber-500/[0.08] py-2.5 text-[12px] font-semibold text-amber-200 transition active:scale-[0.98] hover:bg-amber-500/[0.12] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isWalletBusy ? "Switching..." : "Switch to Arbitrum Sepolia"}
            </button>
          ) : (
            <button
              type="button"
              onClick={disconnectWallet}
              className="w-full rounded-[10px] border border-rose-500/25 bg-rose-500/[0.08] py-2.5 text-[12px] font-semibold text-rose-300 transition active:scale-[0.98] hover:bg-rose-500/[0.12]"
            >
              Disconnect Wallet
            </button>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
        className="space-y-2"
      >
        <div className="px-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Account</div>
        {accountItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              type="button"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 + 0.25, duration: 0.25 }}
              className="flex w-full items-center gap-3 rounded-[14px] border border-white/[0.07] bg-white/[0.025] p-3 transition active:scale-[0.98]"
            >
              <div className="rounded-[10px] border border-blue-400/20 bg-blue-500/10 p-2.5">
                <Icon className="h-4 w-4 text-blue-300" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-[12px] font-semibold text-white">{item.label}</div>
                <div className="truncate text-[10px] text-slate-400">{item.description}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </motion.button>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.35 }}
        className="space-y-2"
      >
        <div className="px-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Preferences</div>
        {preferenceItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              type="button"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 + 0.45, duration: 0.25 }}
              className="flex w-full items-center gap-3 rounded-[14px] border border-white/[0.07] bg-white/[0.025] p-3 transition active:scale-[0.98]"
            >
              <div className="rounded-[10px] border border-blue-400/20 bg-blue-500/10 p-2.5">
                <Icon className="h-4 w-4 text-blue-300" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-[12px] font-semibold text-white">{item.label}</div>
                <div className="truncate text-[10px] text-slate-400">{item.description}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </motion.button>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.35 }}
        className="rounded-[14px] border border-white/[0.07] bg-white/[0.025] p-4"
      >
        <div className="text-[12px] font-semibold text-white">Backend Services</div>
        <div className="mt-3 space-y-2 text-[11px]">
          <SummaryRow label="Persistence" value={systemStatus.services.persistence.activeStore} />
          <SummaryRow label="Redis" value={systemStatus.services.redis.healthy ? "Healthy" : "Unavailable"} />
          <SummaryRow label="Pinata" value={systemStatus.services.pinata.healthy ? "Healthy" : "Unavailable"} />
          <SummaryRow label="Supabase" value={systemStatus.services.supabase.healthy ? "Healthy" : "Unavailable"} />
          <SummaryRow label="Custody" value={systemStatus.services.custody?.healthy ? "Healthy" : "Unavailable"} />
          <SummaryRow label="QStash" value={systemStatus.services.qstash?.healthy ? "Healthy" : "Unavailable"} />
        </div>
      </motion.div>
      {custodySnapshot && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58, duration: 0.35 }}
          className="rounded-[14px] border border-white/[0.07] bg-white/[0.025] p-4"
        >
          <div className="text-[12px] font-semibold text-white">Custodial Wallets</div>
          <div className="mt-3 space-y-2 text-[11px]">
            <SummaryRow label="Active" value={`${custodySnapshot.activeWallets}`} />
            <SummaryRow label="Buyers" value={`${custodySnapshot.activeBuyers}`} />
            <SummaryRow label="Sellers" value={`${custodySnapshot.activeSellers}`} />
            <SummaryRow label="Pool ETH" value={`${custodySnapshot.poolEthBalance ?? "0"} ETH`} />
            <SummaryRow label="Pool tUSD" value={`${custodySnapshot.poolTusdBalance ?? "0"} tUSD`} />
          </div>
          <div className="mt-3 space-y-2 text-[11px]">
            {custodySnapshot.activeWalletRows.slice(0, 4).map((wallet) => (
              <SummaryRow
                key={wallet.id}
                label={`${wallet.company} (${wallet.role})`}
                value={`${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
                stacked
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
