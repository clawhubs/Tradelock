"use client";

import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Copy,
  ExternalLink,
  FileBadge2,
  FileCheck2,
  FileSearch2,
  Filter,
  Globe2,
  HandCoins,
  LayoutGrid,
  Lock,
  LucideIcon,
  Network,
  MoreHorizontal,
  PanelLeft,
  Plus,
  Scale,
  ScanSearch,
  Search,
  Settings2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TimerReset,
  Upload,
  User,
  Users2,
  Wallet,
  X,
} from "lucide-react";
import { useTradeLockData } from "@/components/tradelock-data-provider";
import { settlementTokenSymbol, withSettlementTokenSymbol } from "@/lib/settlement-token";
import { getTxExplorerUrl, shortenHash } from "@/lib/explorer";
import type { CustodyActivityItem, NavItem, ScreenKey, SettingsCard, StatCard, StatusKey, ToneKey, WalletState } from "@/lib/types";

export const toneClasses: Record<ToneKey, string> = {
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  purple: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  orange: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  red: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  slate: "border-slate-500/30 bg-slate-500/10 text-slate-200",
};

export const badgeClasses: Record<StatusKey, string> = {
  "Ready to Release": "border-emerald-500/35 bg-emerald-500/12 text-emerald-300",
  "Proof Verified": "border-cyan-500/35 bg-cyan-500/12 text-cyan-300",
  Funded: "border-violet-500/35 bg-violet-500/12 text-violet-300",
  Completed: "border-slate-400/35 bg-slate-400/12 text-slate-200",
  "Waiting Proof": "border-amber-500/35 bg-amber-500/12 text-amber-300",
  Submitted: "border-blue-500/35 bg-blue-500/12 text-blue-300",
  Active: "border-blue-500/35 bg-blue-500/12 text-blue-300",
  Disputed: "border-rose-500/35 bg-rose-500/12 text-rose-300",
  "Under Review": "border-amber-500/35 bg-amber-500/12 text-amber-300",
  "Evidence Submitted": "border-blue-500/35 bg-blue-500/12 text-blue-300",
  Resolved: "border-emerald-500/35 bg-emerald-500/12 text-emerald-300",
  Archived: "border-slate-500/35 bg-slate-500/12 text-slate-300",
  Verified: "border-emerald-500/35 bg-emerald-500/12 text-emerald-300",
  Finalized: "border-blue-500/35 bg-blue-500/12 text-blue-300",
  Trusted: "border-emerald-500/35 bg-emerald-500/12 text-emerald-300",
  "Business Verified": "border-emerald-500/35 bg-emerald-500/12 text-emerald-300",
  "Low Risk": "border-emerald-500/35 bg-emerald-500/12 text-emerald-300",
  "Frozen in escrow": "border-violet-500/35 bg-violet-500/12 text-violet-300",
  Confirmed: "border-emerald-500/35 bg-emerald-500/12 text-emerald-300",
};

export const navIcons: Record<ScreenKey, LucideIcon> = {
  judge: Scale,
  dashboard: LayoutGrid,
  deals: FileBadge2,
  create: Plus,
  disputes: ShieldAlert,
  audit: FileSearch2,
  counterparties: Users2,
  settings: Settings2,
};

export const toneIcons: Record<ToneKey, LucideIcon> = {
  blue: LayoutGrid,
  green: HandCoins,
  purple: Lock,
  orange: Shield,
  cyan: ScanSearch,
  red: ShieldAlert,
  slate: Circle,
};

export const screenMeta: Record<ScreenKey, { title: string; description: string }> = {
  judge: {
    title: "Judge Mode",
    description: "A guided review map for demo flow, wallets, disputes, proofs, and architecture.",
  },
  dashboard: {
    title: "Global B2B Escrow Dashboard",
    description: "Secure. Transparent. Gasless.",
  },
  deals: {
    title: "Deals",
    description: "Manage all escrow agreements across global counterparties.",
  },
  create: {
    title: "Create New Deal",
    description: "Set up a secure, transparent escrow for your cross-border B2B transaction.",
  },
  disputes: {
    title: "Disputes",
    description: "Resolve cross-border escrow conflicts with transparent evidence and structured workflows.",
  },
  audit: {
    title: "Audit Trail",
    description: "Track every escrow action with immutable on-chain records and verifiable proof.",
  },
  counterparties: {
    title: "Counterparties",
    description: "Manage trusted buyers and sellers across your global trading network.",
  },
  settings: {
    title: "Settings",
    description: "Configure your organization, security, and platform preferences.",
  },
};

export function Panel({
  title,
  action,
  className,
  children,
}: {
  title?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`glass-panel relative rounded-[12px] border border-white/[0.1] p-3.5 ${className ?? ""}`}>
      <div className="pointer-events-none absolute inset-x-[15%] top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(80,150,255,0.4),transparent)]" />
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-[15px] font-semibold text-white">{title}</div>
          {typeof action === "string" ? <button className="text-[11px] text-blue-300 transition-colors hover:text-blue-200">{action}</button> : action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatusBadge({
  status,
  label,
  compact = false,
}: {
  status: StatusKey;
  label?: string;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex whitespace-nowrap items-center rounded-[4px] border px-2.5 py-1 text-[10px] font-medium leading-none ${
        badgeClasses[status]
      } ${compact ? "px-2 py-[5px] text-[10px]" : ""}`}
    >
      {label ?? status}
    </span>
  );
}

export function SummaryRow({
  label,
  value,
  emphasized = false,
  stacked = false,
}: {
  label: string;
  value: ReactNode;
  emphasized?: boolean;
  stacked?: boolean;
}) {
  return (
    <div className={`flex ${stacked ? "flex-col gap-1" : "items-center justify-between gap-3"}`}>
      <span className="text-slate-400">{label}</span>
      <span className={`text-right ${emphasized ? "font-semibold text-white" : "text-slate-200"}`}>{value}</span>
    </div>
  );
}

export function ActionButton({
  tone,
  label,
  icon: Icon,
  outlined = false,
  small = false,
  onClick,
  disabled = false,
}: {
  tone: ToneKey;
  label: string;
  icon: LucideIcon;
  outlined?: boolean;
  small?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const palette: Record<ToneKey, string> = {
    blue: outlined
      ? "border-blue-400/40 text-blue-200 hover:bg-blue-500/10"
      : "border-blue-500/30 bg-[linear-gradient(135deg,#2563eb,#1d4ed8)] text-white shadow-[0_4px_16px_rgba(37,99,235,0.32)] hover:shadow-[0_6px_22px_rgba(37,99,235,0.5)]",
    green: outlined
      ? "border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/10"
      : "border-emerald-500/30 bg-[linear-gradient(135deg,#059669,#047857)] text-white shadow-[0_4px_14px_rgba(5,150,105,0.28)] hover:shadow-[0_6px_20px_rgba(5,150,105,0.45)]",
    purple: outlined
      ? "border-violet-400/40 text-violet-200 hover:bg-violet-500/10"
      : "border-violet-500/40 bg-violet-600 text-white hover:bg-violet-500",
    orange: outlined
      ? "border-orange-400/40 text-orange-200 hover:bg-orange-500/10"
      : "border-orange-500/40 bg-orange-600 text-white hover:bg-orange-500",
    cyan: outlined
      ? "border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/10"
      : "border-cyan-500/40 bg-cyan-600 text-white hover:bg-cyan-500",
    red: outlined
      ? "border-rose-400/40 text-rose-200 hover:bg-rose-500/10"
      : "border-rose-500/40 bg-rose-600 text-white hover:bg-rose-500",
    slate: outlined
      ? "border-slate-400/30 text-slate-200 hover:bg-slate-500/10"
      : "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.07]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-[7px] border font-medium transition ${palette[tone]} ${
        small ? "px-4 py-2.5 text-[13px]" : "px-4 py-3.5"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export function FilterRow({
  filters,
  compact = false,
  activeFilter,
  onSelect,
}: {
  filters: string[];
  compact?: boolean;
  activeFilter?: string;
  onSelect?: (filter: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter, index) => {
        const active = activeFilter ? activeFilter === filter : index === 0;
        return (
        <button
          key={filter}
          type="button"
          aria-pressed={active}
          onClick={() => onSelect?.(filter)}
          className={`rounded-[8px] border font-medium ${
            active
              ? "border-blue-400/50 bg-blue-500/18 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              : "border-white/[0.1] bg-white/[0.025] text-slate-300 hover:bg-white/[0.045]"
          } ${compact ? "px-3 py-1.5 text-[11px]" : "px-3 py-2 text-[12px]"}`}
        >
          {filter}
        </button>
        );
      })}
    </div>
  );
}

export function ToolbarButton({ label, icon: Icon, onClick, disabled = false }: { label: string; icon: LucideIcon; onClick?: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="inline-flex items-center gap-2 rounded-[8px] border border-white/[0.1] bg-white/[0.025] px-3 py-2 text-[12px] text-slate-300 transition hover:bg-white/[0.045] disabled:cursor-not-allowed disabled:opacity-60">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export function SearchField({ placeholder, value = "", onChange }: { placeholder: string; value?: string; onChange?: (value: string) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-500">
      <Search className="h-4 w-4" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
      />
    </div>
  );
}

export function StatGrid({
  stats,
  columns,
  compact = false,
}: {
  stats: StatCard[];
  columns: string;
  compact?: boolean;
}) {
  return (
    <div className={`grid gap-3 ${columns}`}>
      {stats.map((stat) => {
        const Icon = toneIcons[stat.tone];
        return (
          <div key={stat.label} className="glass-card rounded-[12px] border border-white/[0.1] px-3.5 py-3 transition-all duration-200 hover:border-white/[0.18]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={`${compact ? "text-[10px] tracking-[0.04em]" : "text-xs"} text-slate-400`}>{stat.label}</div>
                <div className={`display-font mt-2 font-semibold text-white ${compact ? "text-[1rem] leading-tight" : "text-[1.45rem]"}`}>
                  {stat.value}
                </div>
                <div className={`mt-2 ${compact ? "text-[10px]" : "text-xs"} text-emerald-300`}>↑ {stat.change}</div>
              </div>
              <div className={`rounded-[10px] border p-2.5 ${toneClasses[stat.tone]}`}>
                <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BrandMark({ compact = false, labelClassName = "" }: { compact?: boolean; labelClassName?: string }) {
  const frameSize = compact ? "h-9 w-9 rounded-[11px]" : "h-10 w-10 rounded-[11px]";
  const textSize = compact ? "text-[1.18rem]" : "text-[1.85rem]";

  return (
    <div className={`flex items-center ${compact ? "gap-2.5" : "gap-3"}`}>
      <div className={`relative overflow-hidden border border-blue-400/45 bg-[linear-gradient(180deg,#091b34,#0b214a)] shadow-[0_0_28px_rgba(37,99,235,0.22)] ${frameSize}`}>
        <div className="absolute inset-[3px] rounded-[0.75rem] border border-white/10 bg-[linear-gradient(180deg,#07101e,#0c1730)]" />
        <div className="absolute left-[8px] top-[8px] h-[21px] w-[5px] -skew-x-[20deg] rounded-full bg-white" />
        <div className="absolute left-[16px] top-[8px] h-[21px] w-[5px] -skew-x-[20deg] rounded-full bg-white" />
        <div className="absolute left-[25px] top-[11px] h-[18px] w-[6px] -skew-x-[20deg] rounded-full bg-[#2da8ff]" />
        <div className="absolute left-[18px] top-[22px] h-[10px] w-[5px] -skew-x-[20deg] rounded-full bg-[#2da8ff]" />
      </div>
      <div className={`display-font font-semibold tracking-tight text-white ${textSize} ${labelClassName}`}>TradeLock</div>
    </div>
  );
}

const txTickerItems = [
  `LIVE MODE · Waiting for market activity on ${settlementTokenSymbol}`,
  "MANAGED WALLETS · Custodial engine is ready for new flows",
  "ARBITRUM SEPOLIA · Explorer links and proofs update in real time",
];

function formatRelativeTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Live";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / 60_000), 0);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return `${Math.floor(diffHours / 24)}d ago`;
}

function formatTickerItem(item: CustodyActivityItem) {
  const timestamp = new Date(item.createdAt);
  const shortTime = Number.isNaN(timestamp.getTime())
    ? "LIVE"
    : timestamp.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false });
  const prefix =
    item.type === "daily-user"
      ? "NEW USER"
      : item.type === "dispute"
        ? "LIVE DISPUTE"
        : item.type === "activity"
          ? "LIVE DEAL"
          : item.type === "funding"
            ? "POOL TOP-UP"
            : "SYSTEM";

  return `${prefix} · ${shortTime} · ${item.summary}`;
}

export function TxTicker({ items }: { items?: CustodyActivityItem[] }) {
  const tickerItems = items && items.length > 0 ? items.map(formatTickerItem) : txTickerItems;

  return (
    <div className="overflow-hidden border-b border-white/[0.08] bg-[linear-gradient(180deg,rgba(9,18,42,0.92),rgba(6,14,34,0.96))] py-[7px]">
      <div
        className="flex items-center whitespace-nowrap"
        style={{ animation: "ticker-scroll 50s linear infinite" }}
      >
        {[...tickerItems, ...tickerItems].map((item, i) => (
          <span key={i} className="flex shrink-0 items-center">
            <span className="mx-5 text-[9px] text-cyan-300/80">◆</span>
            <span className="text-[11px] font-medium text-slate-200/95">{item}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function NotificationDropdown({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { custodySnapshot, data } = useTradeLockData();
  const notifications =
    custodySnapshot?.recentActivity.slice(0, 6).map((item) => ({
      id: item.id,
      title:
        item.type === "daily-user"
          ? "New User Joined"
          : item.type === "dispute"
            ? "Dispute Opened"
            : item.type === "activity"
              ? "Deal Lifecycle Completed"
              : "System Update",
      body: item.summary,
      time: formatRelativeTime(item.createdAt),
      color:
        item.type === "dispute"
          ? "bg-orange-400"
          : item.type === "daily-user"
            ? "bg-blue-400"
            : "bg-emerald-400",
    })) ??
    data.auditEvents.slice(0, 6).map((event) => ({
      id: event.id,
      title: event.type,
      body: `${event.dealId} · ${event.actor}`,
      time: formatRelativeTime(event.timestamp),
      color:
        event.status === "Finalized" || event.status === "Verified"
          ? "bg-emerald-400"
          : event.status === "Under Review"
            ? "bg-orange-400"
            : "bg-blue-400",
    }));
  return (
    <AnimatePresence>
      {open && (
        <>
          <button onClick={onClose} aria-hidden className="fixed inset-0 z-40 cursor-default" />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-2 w-[340px]"
          >
            <div className="glass-panel overflow-hidden rounded-[14px] border border-white/[0.12] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
                <div className="text-[13px] font-semibold text-white">Notifications</div>
                <button className="text-[11px] text-blue-300 transition hover:text-blue-200">Mark all read</button>
              </div>
              <div className="data-scroll max-h-[400px] overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 border-b border-white/[0.04] px-4 py-3 transition last:border-b-0 hover:bg-white/[0.03]">
                    <div className={`mt-1 h-2 w-2 rounded-full ${n.color} shadow-[0_0_8px_currentColor]`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-medium text-white">{n.title}</div>
                      <div className="text-[11px] text-slate-400">{n.body}</div>
                      <div className="mt-1 text-[10px] text-slate-500">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/[0.08] bg-white/[0.01] px-4 py-2.5 text-center">
                <button className="text-[11px] text-blue-300 transition hover:text-blue-200">View all activity</button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function TopBar({
  onOpenSearch,
  walletState,
  isWalletBusy,
  onConnectWallet,
  onDisconnectWallet,
  onSwitchWalletNetwork,
  onOpenCreateDeal,
}: {
  onOpenSearch?: () => void;
  walletState: WalletState;
  isWalletBusy: boolean;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onSwitchWalletNetwork: () => void;
  onOpenCreateDeal?: () => void;
}) {
  const [bellOpen, setBellOpen] = useState(false);
  const { custodySnapshot } = useTradeLockData();
  const notificationCount = custodySnapshot?.recentActivity.length ?? 0;
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] bg-white/[0.01] px-4 py-3 backdrop-blur-sm">
      <div className="flex flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex max-w-[348px] flex-1 items-center gap-3 rounded-[8px] border border-white/[0.12] bg-white/[0.02] px-4 py-[10px] text-slate-400 transition hover:border-white/[0.18] hover:bg-white/[0.04]"
        >
          <Search className="h-4 w-4" />
          <span className="truncate text-[12px]">Search deals, counterparties, TX hashes...</span>
          <span className="ml-auto text-[10px] text-slate-500">⌘ K</span>
        </button>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-semibold tracking-widest text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          LIVE
        </div>
        <div className="relative">
          <button onClick={() => setBellOpen((v) => !v)} className="relative p-2 text-slate-300 transition hover:text-white">
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-1 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-semibold text-white">{Math.min(notificationCount, 9)}</span>
          </button>
          <NotificationDropdown open={bellOpen} onClose={() => setBellOpen(false)} />
        </div>
        <TopPill icon={Globe2} label={walletState.shortAddress} />
        <TopPill icon={Network} label={walletState.chainName} useArbitrumLogo />
        {walletState.isConnected && (
          <TopPill icon={Wallet} label={`${walletState.settlementBalance} ${walletState.settlementSymbol}`} />
        )}
        {!walletState.isConnected ? (
          <ActionButton tone="blue" label={isWalletBusy ? "Connecting..." : walletState.connectionLabel} icon={Wallet} small disabled={isWalletBusy} onClick={onConnectWallet} />
        ) : !walletState.isCorrectNetwork ? (
          <ActionButton tone="orange" label={isWalletBusy ? "Switching..." : "Switch Network"} icon={Network} small disabled={isWalletBusy} onClick={onSwitchWalletNetwork} />
        ) : (
          <ActionButton tone="slate" label="Disconnect" icon={Wallet} small onClick={onDisconnectWallet} />
        )}
        <ActionButton tone="blue" label="Create Deal" icon={Plus} small onClick={onOpenCreateDeal} />
      </div>
    </div>
  );
}

export function ArbitrumBadge({ size = 18 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-[6px] bg-[#0a1830] ring-1 ring-white/10"
      style={{ width: size, height: size }}
      aria-label="Arbitrum"
      title="Arbitrum"
    >
      <img
        src="/arbitrum-network-logo.png"
        alt=""
        aria-hidden="true"
        className="h-[84%] w-[84%] object-contain"
      />
    </div>
  );
}

export function TopPill({
  icon: Icon,
  label,
  useArbitrumLogo = false,
}: {
  icon: LucideIcon;
  label: string;
  useArbitrumLogo?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-[8px] border border-white/[0.12] bg-white/[0.02] px-3 py-[10px] text-[12px] text-slate-200">
      {useArbitrumLogo ? <ArbitrumBadge size={18} /> : <Icon className="h-3.5 w-3.5 text-blue-300" />}
      <span>{label}</span>
      <ChevronDown className="h-4 w-4 text-slate-500" />
    </div>
  );
}

export function MiniSidebarCard({
  title,
  value,
  subtitle,
  icon: Icon,
  dotColor,
  useArbitrumLogo = false,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  dotColor: string;
  useArbitrumLogo?: boolean;
}) {
  return (
    <div className="rounded-[10px] border border-white/[0.12] bg-white/[0.02] px-3 py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-[8px] border border-blue-400/20 bg-blue-500/10 p-2">
          {useArbitrumLogo ? <ArbitrumBadge size={22} /> : <Icon className="h-3.5 w-3.5 text-blue-300" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{title}</div>
          <div className="mt-1 flex items-center gap-2 text-sm text-white">
            <span className={`status-dot ${dotColor}`} />
            <span className="truncate">{value}</span>
          </div>
          {subtitle && <div className="mt-1 text-xs text-slate-500">{subtitle}</div>}
        </div>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </div>
    </div>
  );
}

export function InfoStack({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <div className="display-font text-3xl font-semibold text-white">{title}</div>
      <div className="mt-1 text-sm text-slate-400">{subtitle}</div>
      <div className="mt-4 space-y-3 text-sm">
        {rows.map(([label, value]) => (
          <SummaryRow key={`${label}-${value}`} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}

export function Pager({
  label,
  currentPage,
  totalPages,
  onPageChange,
}: {
  label: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pageItems =
    totalPages <= 5
      ? Array.from({ length: totalPages }, (_, index) => index + 1)
      : [1, currentPage - 1, currentPage, currentPage + 1, totalPages].filter(
          (page, index, pages) => page >= 1 && page <= totalPages && pages.indexOf(page) === index,
        );

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
      <div>{label}</div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="rounded-xl border border-white/10 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Prev
        </button>
        {pageItems.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-pressed={page === currentPage}
            className={`rounded-xl border px-3 py-2 ${
              page === currentPage ? "border-blue-400/50 bg-blue-500/20 text-white" : "border-white/10"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="rounded-xl border border-white/10 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function DealSummaryCard({
  deal,
  className,
  onApproveToken,
  onFundEscrow,
  onUploadProof,
  onReleaseFunds,
  onOpenDispute,
  approvePending = false,
  fundPending = false,
  uploadPending = false,
  releasePending = false,
  disputePending = false,
  approveDisabled = false,
  fundDisabled = false,
  uploadDisabled = false,
  releaseDisabled = false,
  disputeDisabled = false,
  onViewTransaction,
}: {
  deal: {
    id: string;
    buyer: string;
    buyerLocation: string;
    seller: string;
    sellerLocation: string;
    amount: string;
    progress: string;
    milestone: string;
    proofFile: string;
    updated: string;
    txHash: string;
    network: string;
    proofHash: string;
    proofStatus: string;
    status: StatusKey;
  };
  className?: string;
  onApproveToken?: () => void;
  onFundEscrow?: () => void;
  onUploadProof?: (file: File) => void;
  onReleaseFunds?: () => void;
  onOpenDispute?: () => void;
  approvePending?: boolean;
  fundPending?: boolean;
  uploadPending?: boolean;
  releasePending?: boolean;
  disputePending?: boolean;
  approveDisabled?: boolean;
  fundDisabled?: boolean;
  uploadDisabled?: boolean;
  releaseDisabled?: boolean;
  disputeDisabled?: boolean;
  onViewTransaction?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const txUrl = getTxExplorerUrl(deal.txHash);

  return (
    <Panel
      title="Deal Summary"
      action={<StatusBadge status={deal.status} compact />}
      className={`h-fit ${className ?? ""}`}
    >
      <div className="space-y-4 text-sm">
        <div className="border-b border-white/8 pb-3">
          <div className="flex items-center gap-2">
            <div className="display-font text-[1.95rem] font-semibold text-white">{deal.id}</div>
            <Copy className="h-4 w-4 text-slate-500" />
          </div>
        </div>

        <div className="grid gap-3">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">Buyer</div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/15 text-sm font-medium text-blue-200">
                {deal.buyer.charAt(0)}
              </div>
              <div>
                <div className="font-medium text-white">{deal.buyer}</div>
                <div className="text-xs text-slate-400">{deal.buyerLocation}</div>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">Seller</div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/15 text-sm font-medium text-blue-200">
                {deal.seller.charAt(0)}
              </div>
              <div>
                <div className="font-medium text-white">{deal.seller}</div>
                <div className="text-xs text-slate-400">{deal.sellerLocation}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 border-y border-white/8 py-3">
          <SummaryRow label="Amount" value={deal.amount} emphasized />
          <SummaryRow label="Network" value={deal.network} />
          <SummaryRow label="Milestone Progress" value={deal.progress} />
          <div className="h-1.5 rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${progressWidth(deal.progress)}%` }} />
          </div>
          <div className="text-xs text-slate-400">{deal.milestone}</div>
        </div>

        <div className="space-y-3">
          <SummaryRow label="Proof File" value={deal.proofFile} />
          <SummaryRow label="Proof Hash" value={deal.proofHash} />
          <SummaryRow label="Proof Verification" value={deal.status === "Completed" || deal.proofStatus === "Proof Verified" ? "Verified" : deal.proofStatus} />
          <SummaryRow label="Last Update" value={deal.updated} />
          <SummaryRow
            label="TX Hash"
            value={
              txUrl ? (
                <a href={txUrl} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
                  {shortenHash(deal.txHash)}
                </a>
              ) : (
                deal.txHash
              )
            }
          />
        </div>

        <div className="grid gap-2 pt-1">
          <ActionButton tone="blue" label="View Deal" icon={ExternalLink} small onClick={onViewTransaction ?? (() => txUrl && window.open(txUrl, "_blank", "noopener,noreferrer"))} disabled={!txUrl && !onViewTransaction} />
          <ActionButton
            tone="purple"
            label={approvePending ? "Approving Token..." : "Approve Token"}
            icon={CheckCircle2}
            small
            disabled={approveDisabled || approvePending}
            onClick={onApproveToken}
          />
          <ActionButton
            tone="green"
            label={fundPending ? "Funding Escrow..." : "Fund Escrow"}
            icon={HandCoins}
            small
            disabled={fundDisabled || fundPending}
            onClick={onFundEscrow}
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file && onUploadProof) {
                onUploadProof(file);
              }
              event.currentTarget.value = "";
            }}
          />
          <ActionButton
            tone="cyan"
            label={uploadPending ? "Uploading Proof..." : "Upload Proof"}
            icon={Upload}
            small
            disabled={uploadDisabled || uploadPending}
            onClick={() => fileInputRef.current?.click()}
          />
          <ActionButton
            tone="green"
            label={releasePending ? "Releasing..." : "Release Funds"}
            icon={Lock}
            small
            disabled={releaseDisabled || releasePending}
            onClick={onReleaseFunds}
          />
          <ActionButton
            tone="orange"
            label={disputePending ? "Opening Dispute..." : "Open Dispute"}
            icon={ShieldAlert}
            outlined
            small
            disabled={disputeDisabled || disputePending}
            onClick={onOpenDispute}
          />
        </div>
      </div>
    </Panel>
  );
}

export function MobileListCard({
  title,
  subtitle,
  badge,
  footer,
  onClick,
  active = false,
}: {
  title: string;
  subtitle: string;
  badge: StatusKey;
  footer: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-[1rem] border p-4 text-left transition ${
        active ? "border-blue-400/40 bg-blue-500/10" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">{title}</div>
        <StatusBadge status={badge} compact />
      </div>
      <div className="mt-2 text-sm text-slate-300">{subtitle}</div>
      <div className="mt-2 text-xs text-slate-500">{footer}</div>
    </button>
  );
}

export function MobilePageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1 px-1">
      <h1 className="display-font text-[1.55rem] font-semibold tracking-tight text-white">{title}</h1>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}

export function MobileDrawer({
  activeScreen,
  setActiveScreen,
  navItems,
  walletState,
  isWalletBusy,
  onConnectWallet,
  onDisconnectWallet,
  onSwitchWalletNetwork,
  onClose,
}: {
  activeScreen: ScreenKey;
  setActiveScreen: (screen: ScreenKey) => void;
  navItems: NavItem[];
  walletState: WalletState;
  isWalletBusy: boolean;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onSwitchWalletNetwork: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <button type="button" aria-label="Close navigation overlay" onClick={onClose} className="absolute inset-0 z-30 bg-[#020611]/70 backdrop-blur-[2px]" />
      <div className="absolute inset-y-0 left-0 z-40 w-[84%] max-w-[320px] border-r border-white/[0.08] bg-[linear-gradient(160deg,rgba(6,18,46,0.95),rgba(4,12,32,0.97))] p-4 shadow-[30px_0_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-3">
          <BrandMark compact />
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-6 space-y-2">
          {navItems.map((item) => {
            const Icon = navIcons[item.key];
            const active = activeScreen === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setActiveScreen(item.key);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
                  active
                    ? "bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-6 space-y-3">
          <MiniSidebarCard
            title="Network"
            value={walletState.chainName}
            icon={Network}
            dotColor={walletState.isCorrectNetwork ? "bg-emerald-400" : "bg-amber-400"}
            subtitle={walletState.isCorrectNetwork ? "Ready for settlement" : "Switch wallet network"}
            useArbitrumLogo
          />
          <MiniSidebarCard
            title="Account"
            value={walletState.shortAddress}
            icon={Wallet}
            dotColor={walletState.isConnected ? "bg-blue-400" : "bg-slate-500"}
            subtitle={walletState.isConnected ? `${walletState.settlementBalance} ${walletState.settlementSymbol}` : walletState.connectionLabel}
          />
          {!walletState.isConnected ? (
            <ActionButton tone="blue" label={isWalletBusy ? "Connecting..." : walletState.connectionLabel} icon={Wallet} small disabled={isWalletBusy} onClick={onConnectWallet} />
          ) : !walletState.isCorrectNetwork ? (
            <ActionButton tone="orange" label={isWalletBusy ? "Switching..." : "Switch Network"} icon={Network} small disabled={isWalletBusy} onClick={onSwitchWalletNetwork} />
          ) : (
            <ActionButton tone="slate" label="Disconnect" icon={Wallet} small onClick={onDisconnectWallet} />
          )}
        </div>
      </div>
    </>
  );
}

export function MobileTopBar({
  walletState,
  isWalletBusy,
  onConnectWallet,
  onSwitchWalletNetwork,
  onOpenCreateDeal,
  onOpenNav,
}: {
  walletState: WalletState;
  isWalletBusy: boolean;
  onConnectWallet: () => void;
  onSwitchWalletNetwork: () => void;
  onOpenCreateDeal?: () => void;
  onOpenNav?: () => void;
}) {
  const { custodySnapshot } = useTradeLockData();
  const notificationCount = custodySnapshot?.recentActivity.length ?? 0;
  return (
    <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] bg-white/[0.01] px-3 py-3.5 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenNav}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-300 transition hover:bg-white/[0.055] hover:text-white"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        <BrandMark compact labelClassName="max-[430px]:hidden" />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Create deal"
          onClick={onOpenCreateDeal}
          className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-2 text-blue-200"
        >
          <Plus className="h-4 w-4" />
        </button>
        {!walletState.isConnected ? (
          <button
            type="button"
            onClick={onConnectWallet}
            disabled={isWalletBusy}
            className="rounded-xl border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-[10px] font-semibold text-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isWalletBusy ? "Connecting..." : "Connect"}
          </button>
        ) : !walletState.isCorrectNetwork ? (
          <button
            type="button"
            onClick={onSwitchWalletNetwork}
            disabled={isWalletBusy}
            className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[10px] font-semibold text-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isWalletBusy ? "Switching..." : "Switch"}
          </button>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-semibold text-slate-200">
            {walletState.shortAddress}
          </div>
        )}
        <div aria-label="Live status" className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-[9px] font-semibold tracking-widest text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        </div>
        <button type="button" aria-label="Notifications" className="relative rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-300">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-blue-500 px-1 text-[8px] font-semibold text-white">{Math.min(notificationCount, 9)}</span>
        </button>
      </div>
    </div>
  );
}

export function MobileBottomNav({
  activeScreen,
  setActiveScreen,
}: {
  activeScreen: ScreenKey;
  setActiveScreen: (s: ScreenKey) => void;
}) {
  const items = [
    { key: "judge" as ScreenKey, label: "Judge", icon: Scale },
    { key: "dashboard" as ScreenKey, label: "Home", icon: LayoutGrid },
    { key: "deals" as ScreenKey, label: "Deals", icon: FileBadge2 },
    { key: "disputes" as ScreenKey, label: "Alerts", icon: ShieldAlert },
    { key: "settings" as ScreenKey, label: "Profile", icon: User },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-20"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      <div className="pointer-events-none absolute inset-x-0 -top-8 h-12 bg-gradient-to-t from-[#020b1a] to-transparent" />
      <div className="relative mx-auto w-full max-w-[1700px] px-4 pb-3 pt-2 sm:px-6 lg:px-8">
        <div className="relative rounded-[28px] border border-white/[0.08] bg-[rgba(6,16,42,0.82)] shadow-[0_20px_60px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-x-[18%] top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(120,170,255,0.4),transparent)]" />
          <div className="relative flex items-center gap-1 p-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active = activeScreen === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveScreen(item.key)}
                className="relative flex flex-1 flex-col items-center gap-1 rounded-[22px] py-2.5 transition active:scale-95"
              >
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute inset-0 rounded-[22px] border border-blue-400/35 bg-[linear-gradient(135deg,rgba(59,130,246,0.32),rgba(29,78,216,0.2))] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_18px_rgba(37,99,235,0.32)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon
                  className={`relative z-10 h-[20px] w-[20px] transition-colors ${
                    active ? "text-white" : "text-slate-400"
                  }`}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span
                  className={`relative z-10 text-[10px] transition-colors ${
                    active ? "font-semibold text-white" : "font-medium text-slate-400"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsTile({ card }: { card: SettingsCard }) {
  const iconMap: Record<string, LucideIcon> = {
    organization: Building2,
    team: Users2,
    wallet: Wallet,
    security: Shield,
    notifications: Bell,
    "dispute-rules": ShieldAlert,
  };

  const Icon = iconMap[card.id] ?? Settings2;

  return (
    <Panel className="h-full">
      <div className="flex h-full flex-col space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-[10px] border border-blue-400/20 bg-blue-500/10 p-2.5">
            <Icon className="h-5 w-5 text-blue-300" />
          </div>
          <div className="font-medium text-white">{card.title}</div>
        </div>
        <div className="flex-1 space-y-2.5 text-sm">
          {card.lines.map((line) => {
            const parts = line.split(": ");
            const hasLabel = parts.length > 1;
            const label = hasLabel ? parts[0] : undefined;
            const value = hasLabel ? parts.slice(1).join(": ") : line;
            const showVerified = line.includes("Verified") || line.includes("Enabled");
            const showArrow = line.includes("Admin") || line.includes("Manager") || line.includes("Viewer");

            return (
              <div key={line} className="rounded-[8px] border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {label && <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</div>}
                    <div className="text-slate-200">{value}</div>
                  </div>
                  {showVerified ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  ) : showArrow ? (
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
        <ActionButton tone="blue" label={card.action} icon={ChevronRight} small />
      </div>
    </Panel>
  );
}

export function progressWidth(progress: string) {
  const [current, total] = progress.split("/").map(Number);
  return (current / total) * 100;
}

export const createIcons = {
  FileBadge2,
  HandCoins,
  TimerReset,
  FileCheck2,
  CheckCircle2,
  ShieldAlert,
  Filter,
  Upload,
  Clock3,
};
