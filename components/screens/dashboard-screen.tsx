"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  FileText,
  Lock,
  Plus,
  ShieldAlert,
  Shield,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import type { AuditEvent, Deal, StatusKey } from "@/lib/types";
import { useTradeLockData } from "@/components/tradelock-data-provider";
import {
  ActionButton,
  ArbitrumBadge,
  MobileListCard,
  Panel,
  StatusBadge,
} from "@/components/tradelock-ui";
import { useToast } from "@/components/toast-provider";
import { settlementTokenSymbol } from "@/lib/settlement-token";
import { getTxExplorerUrl, shortenHash } from "@/lib/explorer";

function flagFor(name: string) {
  if (name.includes("GlobalImport")) return "🇸🇬";
  if (name.includes("Dubai")) return "🇦🇪";
  if (name.includes("Ningbo") || name.includes("Shenzhen")) return "🇨🇳";
  if (name.includes("Quality")) return "🇩🇪";
  return "🌐";
}

function parseAmount(value: string) {
  return Number(value.replace(/[^0-9.]/g, ""));
}

function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function compactUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function compactTimestamp(value: string) {
  return value.replace(/, (\d{4}) /, ", ").replace(" AM", "").replace(" PM", "");
}

function fullTimestamp(value: string) {
  return value.replace(/, (\d{4}) /, ", $1 • ");
}

function eventTone(event: AuditEvent) {
  if (event.type.includes("Dispute")) return "orange";
  if (event.type.includes("Released") || event.type.includes("Verified")) return "green";
  return "blue";
}

function AnimatedValue({ text }: { text: string }) {
  const match = text.match(/^([^0-9]*)([0-9][0-9,.]*)(.*)$/);
  const [displayed, setDisplayed] = useState(text);

  useEffect(() => {
    if (!match) return;
    const [, prefix, numStr, suffix] = match;
    const target = parseFloat(numStr.replace(/,/g, ""));
    const hasDecimals = numStr.includes(".");
    const start = performance.now();
    const dur = 1400;
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      const v = eased * target;
      setDisplayed(
        `${prefix}${v.toLocaleString("en-US", {
          minimumFractionDigits: hasDecimals ? 2 : 0,
          maximumFractionDigits: hasDecimals ? 2 : 0,
        })}${suffix}`,
      );
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text]);

  return <>{displayed}</>;
}

function WorldConnections() {
  const cities = [
    { name: "Singapore", x: 76, y: 58 },
    { name: "Dubai", x: 62, y: 45 },
    { name: "Shenzhen", x: 79, y: 42 },
    { name: "Frankfurt", x: 51.5, y: 28 },
    { name: "New York", x: 23, y: 33 },
    { name: "Seoul", x: 82, y: 36 },
  ];
  const connections = [
    { from: 0, to: 1, color: "#3b82f6", dur: "3s" },
    { from: 0, to: 2, color: "#10b981", dur: "3.5s" },
    { from: 1, to: 3, color: "#8b5cf6", dur: "4s" },
    { from: 2, to: 3, color: "#06b6d4", dur: "2.8s" },
    { from: 3, to: 4, color: "#f59e0b", dur: "3.8s" },
    { from: 5, to: 3, color: "#6366f1", dur: "3.2s" },
  ];
  function arc(c1: (typeof cities)[0], c2: (typeof cities)[0]) {
    const mx = (c1.x + c2.x) / 2;
    const my = (c1.y + c2.y) / 2 - Math.abs(c2.x - c1.x) * 0.22;
    return `M ${c1.x} ${c1.y} Q ${mx} ${my} ${c2.x} ${c2.y}`;
  }
  return (
    <Panel title="Cross-Border Deal Network" action="6 active corridors">
      <div className="relative overflow-hidden rounded-[8px] bg-[linear-gradient(180deg,rgba(4,10,28,0.7),rgba(2,6,18,0.85))]" style={{ height: "130px" }}>
        <div className="absolute inset-0 world-grid opacity-20" />
        <svg viewBox="0 0 100 65" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
          {connections.map(({ from, to, color, dur }, i) => {
            const d = arc(cities[from], cities[to]);
            const id = `arc-${i}`;
            return (
              <g key={i}>
                <path id={id} d={d} fill="none" stroke={color} strokeWidth="0.2" strokeOpacity="0.22" />
                <circle r="0.8" fill={color} fillOpacity="0.9">
                  <animateMotion dur={dur} repeatCount="indefinite">
                    <mpath href={`#${id}`} />
                  </animateMotion>
                </circle>
              </g>
            );
          })}
          {cities.map((city, i) => (
            <g key={city.name}>
              <circle cx={city.x} cy={city.y} r="2.5" fill="none" stroke="white" strokeWidth="0.18" strokeOpacity="0.12">
                <animate attributeName="r" values="2.5;4.8;2.5" dur={`${2 + i * 0.35}s`} repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.12;0;0.12" dur={`${2 + i * 0.35}s`} repeatCount="indefinite" />
              </circle>
              <circle cx={city.x} cy={city.y} r="0.9" fill="white" fillOpacity="0.8" />
            </g>
          ))}
        </svg>
        <div className="absolute bottom-2 left-3 flex flex-wrap gap-3">
          {cities.map((city) => (
            <span key={city.name} className="text-[9px] font-medium tracking-widest text-slate-500">{city.name.toUpperCase()}</span>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function DashboardDesktopScreen({
  selectedDeal,
  onSelectDeal,
}: {
  selectedDeal: Deal;
  onSelectDeal: (id: string) => void;
}) {
  const { data, custodySnapshot, releaseFundsForDeal, openDisputeForDeal, walletState } = useTradeLockData();
  const { toast } = useToast();
  const { deals, disputes, overviewStats, auditEvents } = data;
  const overviewRows = deals.slice(0, 4);
  const selectedDispute = disputes.find((dispute) => dispute.dealId === selectedDeal.id);
  const selectedDealTxUrl = getTxExplorerUrl(selectedDeal.txHash);
  const activityRows =
    custodySnapshot?.recentActivity?.slice(0, 4).map((event) => [
      event.type === "daily-user" ? "New User Joined" : event.type === "dispute" ? "Live Dispute" : "Live Activity",
      event.summary,
      compactTimestamp(new Date(event.createdAt).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "numeric", minute: "2-digit", hour12: true })),
      event.type === "dispute" ? "orange" : "green",
    ] as const) ??
    auditEvents.slice(0, 4).map((event) => [
      event.type,
      `${event.dealId} • ${event.actor}`,
      compactTimestamp(event.timestamp),
      eventTone(event),
    ] as const);
  const escrowBreakdown = [
    {
      label: "Funded",
      value: deals
        .filter((deal) => ["Funded", "Active", "Waiting Proof", "Disputed"].includes(deal.status))
        .reduce((sum, deal) => sum + parseAmount(deal.amountRaw), 0),
      dot: "bg-emerald-400",
    },
    {
      label: "Proof Verified",
      value: deals
        .filter((deal) => deal.status === "Proof Verified")
        .reduce((sum, deal) => sum + parseAmount(deal.amountRaw), 0),
      dot: "bg-blue-400",
    },
    {
      label: "Ready to Release",
      value: deals
        .filter((deal) => deal.status === "Ready to Release")
        .reduce((sum, deal) => sum + parseAmount(deal.amountRaw), 0),
      dot: "bg-violet-400",
    },
    {
      label: "Completed",
      value: deals
        .filter((deal) => deal.status === "Completed")
        .reduce((sum, deal) => sum + parseAmount(deal.amountRaw), 0),
      dot: "bg-orange-400",
    },
  ];
  const totalEscrowVolume = escrowBreakdown.reduce((sum, item) => sum + item.value, 0);
  const cumulativeStops = escrowBreakdown.reduce<number[]>((acc, item) => {
    const next = (acc[acc.length - 1] ?? 0) + (totalEscrowVolume === 0 ? 0 : (item.value / totalEscrowVolume) * 100);
    acc.push(next);
    return acc;
  }, []);
  const donutGradient = `conic-gradient(#1dbb6d 0 ${cumulativeStops[0] ?? 0}%, #1957d5 ${cumulativeStops[0] ?? 0}% ${cumulativeStops[1] ?? 0}%, #9145d8 ${cumulativeStops[1] ?? 0}% ${cumulativeStops[2] ?? 0}%, #f48120 ${cumulativeStops[2] ?? 0}% 100%)`;
  const statCards = [
    {
      label: overviewStats[0].label,
      value: overviewStats[0].value,
      change: overviewStats[0].change,
      icon: FileText,
      iconClass: "border-blue-400/45 bg-[linear-gradient(180deg,#1e56dc,#173da8)] text-white shadow-[0_10px_22px_rgba(30,86,220,0.2)]",
      changeClass: "text-emerald-300",
      accentColor: "bg-blue-500",
    },
    {
      label: overviewStats[1].label,
      value: overviewStats[1].value,
      change: overviewStats[1].change,
      icon: CircleDollarSign,
      iconClass: "border-emerald-400/45 bg-[linear-gradient(180deg,#0e8f54,#0d6f43)] text-white shadow-[0_10px_22px_rgba(16,185,129,0.18)]",
      changeClass: "text-emerald-300",
      accentColor: "bg-emerald-500",
    },
    {
      label: overviewStats[2].label,
      value: overviewStats[2].value,
      change: overviewStats[2].change,
      icon: Lock,
      iconClass: "border-violet-400/45 bg-[linear-gradient(180deg,#6f2bd0,#4a1c93)] text-white shadow-[0_10px_22px_rgba(139,92,246,0.18)]",
      changeClass: "text-emerald-300",
      accentColor: "bg-violet-500",
    },
    {
      label: overviewStats[3].label,
      value: overviewStats[3].value,
      change: overviewStats[3].change,
      icon: Shield,
      iconClass: "border-orange-400/45 bg-[linear-gradient(180deg,#9a4a04,#6d3303)] text-orange-100 shadow-[0_10px_22px_rgba(249,115,22,0.16)]",
      changeClass: "text-orange-300",
      accentColor: "bg-orange-400",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.07, duration: 0.38, ease: "easeOut" }}
              className="glass-card rounded-[12px] border border-white/[0.1] px-4 py-3.5 transition-all duration-200 hover:border-white/[0.18]"
            >
              <div className={`absolute left-0 top-4 bottom-4 w-[3px] rounded-r-sm opacity-60 ${card.accentColor}`} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] text-slate-400">{card.label}</div>
                  <div className="mt-2 display-font text-[15px] font-semibold leading-tight text-white">
                    <AnimatedValue text={card.value} />
                  </div>
                  <div className={`mt-2 text-[11px] ${card.changeClass}`}>↑ {card.change}</div>
                </div>
                <div className={`rounded-[14px] border p-3 ${card.iconClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <WorldConnections />

      <div className="grid gap-3 xl:items-start xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-3">
          {custodySnapshot && (
            <Panel title="Live Custody Network" action={`${custodySnapshot.activeWallets} active wallets`}>
              <div className="grid gap-3 md:grid-cols-4 text-[12px]">
                <div>
                  <div className="text-slate-400">Active Buyers</div>
                  <div className="mt-1 text-white">{custodySnapshot.activeBuyers}</div>
                </div>
                <div>
                  <div className="text-slate-400">Active Sellers</div>
                  <div className="mt-1 text-white">{custodySnapshot.activeSellers}</div>
                </div>
                <div>
                  <div className="text-slate-400">Pool ETH</div>
                  <div className="mt-1 text-white">{custodySnapshot.poolEthBalance ?? "0"} ETH</div>
                </div>
                <div>
                  <div className="text-slate-400">Pool tUSD</div>
                  <div className="mt-1 text-white">{custodySnapshot.poolTusdBalance ?? "0"} tUSD</div>
                </div>
              </div>
            </Panel>
          )}
          <Panel title="Recent Deals" action="View all">
            <div className="overflow-hidden rounded-[8px] border border-white/8">
              <table className="min-w-full divide-y divide-white/5 text-left">
                <thead className="bg-white/[0.04] text-[10px] text-slate-400">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">Deal ID</th>
                    <th className="px-3 py-2.5 font-medium">Buyer / Seller</th>
                    <th className="px-3 py-2.5 font-medium">Amount</th>
                    <th className="px-3 py-2.5 font-medium">Asset</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-3 py-2.5 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {overviewRows.map((deal, index) => (
                    <motion.tr
                      key={deal.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 + 0.25, duration: 0.25, ease: "easeOut" }}
                      onClick={() => onSelectDeal(deal.id)}
                      className={`cursor-pointer transition ${deal.id === selectedDeal.id ? "bg-blue-500/8" : ""} hover:bg-white/[0.03]`}
                    >
                      <td className="px-3 py-3 font-medium text-[11px] text-white">{deal.id}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span>{flagFor(deal.buyer)}</span>
                          <span>{deal.buyer}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                          <span>{flagFor(deal.seller)}</span>
                          <span>{deal.seller}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[11px]">{deal.amountRaw}</td>
                      <td className="px-3 py-3 text-[11px]">{settlementTokenSymbol}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={deal.status} compact />
                      </td>
                      <td className="px-3 py-3 text-[10px] text-slate-400">{compactTimestamp(deal.updated)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel
            title="Selected Deal"
            action={<StatusBadge status={selectedDeal.status} compact />}
            className="self-start"
          >
            <div className="grid gap-0 xl:grid-cols-[240px_1fr_1fr_1fr]">
              <div className="border-b border-white/8 pb-3 xl:border-b-0 xl:border-r xl:pr-5">
                <div className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Escrow ID</div>
                <div className="mt-2 display-font text-[33px] font-semibold leading-none text-white">{selectedDeal.id}</div>
                <div className="mt-4 space-y-3 text-[12px]">
                  <div className="flex justify-between gap-3"><span className="text-slate-400">Amount</span><span className="text-white">{selectedDeal.amount}</span></div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">Network</span>
                    <span className="flex items-center gap-2 text-white">
                      <ArbitrumBadge size={16} />
                      Arbitrum Sepolia
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-b border-white/8 py-3 xl:border-b-0 xl:border-r xl:px-4 xl:py-0">
                <div className="text-[10px] text-slate-400">Buyer</div>
                <div className="mt-1 flex items-start gap-2 text-[12px] text-white"><span>{flagFor(selectedDeal.buyer)}</span><span>{selectedDeal.buyer}</span></div>
                <div className="text-[10px] text-slate-400">{selectedDeal.buyerLocation}</div>
                <div className="mt-5 text-[10px] text-slate-400">Proof Submitted</div>
                <div className="mt-1 flex items-center gap-2 text-[12px] text-white"><FileText className="h-4 w-4 text-slate-400" />{selectedDeal.proofFile}</div>
              </div>

              <div className="border-b border-white/8 py-3 xl:border-b-0 xl:border-r xl:px-4 xl:py-0">
                <div className="text-[10px] text-slate-400">Seller</div>
                <div className="mt-1 flex items-start gap-2 text-[12px] text-white"><span>{flagFor(selectedDeal.seller)}</span><span>{selectedDeal.seller}</span></div>
                <div className="text-[10px] text-slate-400">{selectedDeal.sellerLocation}</div>
                <div className="mt-5 text-[10px] text-slate-400">Proof Status</div>
                <div className="mt-1 flex items-center gap-2 text-[12px] text-emerald-300"><CheckCircle2 className="h-4 w-4" />{selectedDeal.proofStatus}</div>
              </div>

              <div className="pt-3 xl:pl-4 xl:pt-0">
                <div className="space-y-4 text-[12px]">
                  <div>
                    <div className="text-[10px] text-slate-400">Last Update</div>
                    <div className="mt-1 text-white">{fullTimestamp(selectedDeal.updated)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">TX Hash</div>
                    {selectedDealTxUrl ? (
                      <a href={selectedDealTxUrl} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1.5 text-blue-300 hover:text-blue-200">
                        <span>{shortenHash(selectedDeal.txHash)}</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <div className="mt-1 text-slate-400">{selectedDeal.txHash}</div>
                    )}
                  </div>
                  {selectedDispute && (
                    <div>
                      <div className="text-[10px] text-slate-400">Linked Dispute</div>
                      <div className="mt-1 text-orange-300">{selectedDispute.id}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel title="Escrow Overview" action="View details">
            <div className="grid grid-cols-[154px_minmax(0,1fr)] items-center gap-4">
              <motion.div
                className="relative h-[154px] w-[154px] rounded-full p-5"
                style={{ background: donutGradient }}
                initial={{ opacity: 0, scale: 0.6, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
              >
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#060f1e] px-3 text-center">
                  <div className="display-font text-[17px] font-semibold leading-tight">{formatUsd(totalEscrowVolume)}</div>
                  <div className="mt-1 text-[11px] leading-none text-slate-400">Total Volume</div>
                </div>
              </motion.div>
              <div className="space-y-2 text-[12px]">
                {escrowBreakdown.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className={`mt-1 h-2.5 w-2.5 rounded-[2px] ${item.dot}`} />
                    <div>
                      <div className="font-medium text-white">{item.label}</div>
                      <div className="text-[11px] text-slate-400">
                        {formatUsd(item.value)} ({totalEscrowVolume === 0 ? 0 : Math.round((item.value / totalEscrowVolume) * 100)}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Recent Activity" action="View all">
            <div className="space-y-2">
              {activityRows.map(([title, body, time, tone], i) => (
                <motion.div
                  key={`${title}-${time}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3, ease: "easeOut" }}
                  className="flex items-start justify-between gap-3 rounded-[8px] border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.04] hover:border-white/[0.1]"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 rounded-full border p-1.5 ${
                        tone === "green"
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                          : tone === "orange"
                            ? "border-orange-400/30 bg-orange-500/10 text-orange-300"
                            : "border-blue-400/30 bg-blue-500/10 text-blue-300"
                      }`}
                    >
                      {tone === "green" ? (
                        <WalletCards className="h-3.5 w-3.5" />
                      ) : tone === "orange" ? (
                        <ShieldAlert className="h-3.5 w-3.5" />
                      ) : (
                        <FileText className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div>
                      <div className="text-[12px] font-medium text-white">{title}</div>
                      <div className="text-[10px] leading-5 text-slate-400">{body}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400">{time}</div>
                </motion.div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-2">
            <ActionButton
              tone="green"
              label="Release Funds"
              icon={Lock}
              small
              onClick={() => void releaseFundsForDeal(selectedDeal)}
              disabled={!walletState.isConnected || !walletState.isCorrectNetwork || !walletState.contractReady}
            />
            <ActionButton
              tone="orange"
              label="Open Dispute"
              icon={ShieldAlert}
              outlined
              small
              onClick={() => void openDisputeForDeal(selectedDeal)}
              disabled={!walletState.isConnected || !walletState.isCorrectNetwork || !walletState.contractReady}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Sparkline({ data, color = "#60a5fa", filled = true }: { data: number[]; color?: string; filled?: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 30;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h * 0.85 - h * 0.075;
    return { x, y };
  });
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const areaPath = filled ? `${linePath} L ${w} ${h} L 0 ${h} Z` : "";
  const gradId = `spark-${color.replace("#", "")}-${Math.abs(data.reduce((a, b) => a + b, 0)).toFixed(0)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full">
      {filled && (
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {filled && <path d={areaPath} fill={`url(#${gradId})`} />}
      <path d={linePath} fill="none" stroke={color} strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DashboardMobileScreen({
  selectedDeal,
}: {
  selectedDeal: Deal;
}) {
  const { data, custodySnapshot, releaseFundsForDeal, openDisputeForDeal, walletState } = useTradeLockData();
  const { toast } = useToast();
  const { deals, disputes, auditEvents } = data;
  const recentDeals = deals.slice(0, 4);
  const selectedDealTxUrl = getTxExplorerUrl(selectedDeal.txHash);
  const activityRows =
    custodySnapshot?.recentActivity?.slice(0, 4).map((event) => [
      event.type === "daily-user" ? "New User Joined" : event.type === "dispute" ? "Live Dispute" : "Live Activity",
      event.summary,
      compactTimestamp(new Date(event.createdAt).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "numeric", minute: "2-digit", hour12: true })),
      event.type === "dispute" ? "orange" : "green",
    ] as const) ??
    auditEvents.slice(0, 4).map((event) => [
      event.type,
      `${event.dealId} • ${event.actor}`,
      compactTimestamp(event.timestamp),
      eventTone(event),
    ] as const);
  const mobileEscrowBreakdown = [
    {
      label: "Funded",
      value: deals.filter((d) => ["Funded", "Active", "Waiting Proof", "Disputed"].includes(d.status)).reduce((s, d) => s + parseAmount(d.amountRaw), 0),
      dot: "bg-emerald-400",
    },
    {
      label: "Proof Verified",
      value: deals.filter((d) => d.status === "Proof Verified").reduce((s, d) => s + parseAmount(d.amountRaw), 0),
      dot: "bg-blue-400",
    },
    {
      label: "Ready to Release",
      value: deals.filter((d) => d.status === "Ready to Release").reduce((s, d) => s + parseAmount(d.amountRaw), 0),
      dot: "bg-violet-400",
    },
    {
      label: "Completed",
      value: deals.filter((d) => d.status === "Completed").reduce((s, d) => s + parseAmount(d.amountRaw), 0),
      dot: "bg-orange-400",
    },
  ];
  const mobileTotalVolume = mobileEscrowBreakdown.reduce((s, i) => s + i.value, 0);
  const mobileStops = mobileEscrowBreakdown.reduce<number[]>((acc, i) => {
    const next = (acc[acc.length - 1] ?? 0) + (mobileTotalVolume === 0 ? 0 : (i.value / mobileTotalVolume) * 100);
    acc.push(next);
    return acc;
  }, []);
  const mobileDonutGradient = `conic-gradient(#1dbb6d 0 ${mobileStops[0] ?? 0}%, #1957d5 ${mobileStops[0] ?? 0}% ${mobileStops[1] ?? 0}%, #9145d8 ${mobileStops[1] ?? 0}% ${mobileStops[2] ?? 0}%, #f48120 ${mobileStops[2] ?? 0}% 100%)`;

  const activeDealsCount = deals.filter((d) => d.status !== "Completed" && d.status !== "Archived").length;
  const pendingReleaseValue = deals.filter((d) => d.status === "Ready to Release").reduce((s, d) => s + parseAmount(d.amountRaw), 0);
  const openDisputesCount = disputes.filter((d) => d.status === "Under Review" || d.status === "Evidence Submitted").length;

  const quickActions = [
    { icon: Plus, label: "Create", color: "from-blue-500 to-blue-600", glow: "rgba(37,99,235,0.45)" },
    { icon: CheckCircle2, label: "Verify", color: "from-emerald-500 to-emerald-600", glow: "rgba(5,150,105,0.4)" },
    { icon: FileText, label: "Audit", color: "from-cyan-500 to-cyan-600", glow: "rgba(6,182,212,0.4)" },
    { icon: ShieldAlert, label: "Dispute", color: "from-orange-500 to-orange-600", glow: "rgba(249,115,22,0.4)" },
  ];

  const statHighlights = [
    {
      label: "Active Deals",
      value: `${activeDealsCount}`,
      change: "Real-time count",
      color: "#60a5fa",
      data: [3, 5, 4, 6, 8, 7, 9, 10, 9, 11, 11, activeDealsCount],
      changeClass: "text-emerald-300",
    },
    {
      label: "Pending Release",
      value: compactUsd(pendingReleaseValue),
      change: "Ready to settle",
      color: "#a78bfa",
      data: [180, 220, 200, 240, 280, 260, 300, 320, 310, 340, 340, Math.max(1, pendingReleaseValue / 1000)],
      changeClass: "text-blue-300",
    },
  ];

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[20px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(37,99,235,0.22)_0%,rgba(109,40,217,0.14)_50%,rgba(8,18,42,0.85)_100%)] p-5"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-blue-500/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-10 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />
        <div className="pointer-events-none absolute inset-x-[20%] top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(120,170,255,0.5),transparent)]" />

        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Total Escrow Volume
            </div>
            <ArbitrumBadge size={20} />
          </div>

          <div className="mt-3 display-font text-[2.2rem] font-semibold leading-none tracking-tight text-white">
            <AnimatedValue text={`$${mobileTotalVolume.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              <TrendingUp className="h-3 w-3" />
              +12.4%
            </div>
            <span className="text-[10px] text-slate-500">vs last week</span>
          </div>

          <div className="-mx-1 mt-4 h-[52px]">
            <Sparkline data={[42, 48, 45, 52, 58, 55, 62, 68, 65, 72, 78, 85]} color="#60a5fa" />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 border-t border-white/[0.07] pt-3">
            <div>
              <div className="text-[9px] uppercase tracking-widest text-slate-500">Active</div>
              <div className="mt-0.5 text-[14px] font-semibold text-white">{activeDealsCount}</div>
            </div>
            <div className="border-l border-white/[0.05] pl-3">
              <div className="text-[9px] uppercase tracking-widest text-slate-500">Pending</div>
              <div className="mt-0.5 text-[14px] font-semibold text-white">{compactUsd(pendingReleaseValue)}</div>
            </div>
            <div className="border-l border-white/[0.05] pl-3">
              <div className="text-[9px] uppercase tracking-widest text-slate-500">Disputes</div>
              <div className="mt-0.5 text-[14px] font-semibold text-orange-300">{openDisputesCount}</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-2">
        {quickActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 + 0.15, duration: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center gap-1.5 rounded-[14px] border border-white/[0.08] bg-white/[0.03] p-2.5 transition active:scale-95"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br ${action.color}`}
                style={{ boxShadow: `0 6px 16px ${action.glow}` }}
              >
                <Icon className="h-[18px] w-[18px] text-white" strokeWidth={2.4} />
              </div>
              <div className="text-[10px] font-medium text-slate-300">{action.label}</div>
            </motion.button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statHighlights.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 + 0.4, duration: 0.3 }}
            className="relative overflow-hidden rounded-[14px] border border-white/[0.08] bg-white/[0.03] p-3"
          >
            <div className="pointer-events-none absolute inset-x-[20%] top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(120,170,255,0.4),transparent)]" />
            <div className="text-[10px] font-medium uppercase tracking-widest text-slate-500">{stat.label}</div>
            <div className="mt-1 display-font text-[1.4rem] font-semibold leading-none text-white">
              <AnimatedValue text={stat.value} />
            </div>
            <div className={`mt-1 text-[10px] ${stat.changeClass}`}>↑ {stat.change}</div>
            <div className="-mx-3 -mb-3 mt-2 h-[28px]">
              <Sparkline data={stat.data} color={stat.color} />
            </div>
          </motion.div>
        ))}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="text-[14px] font-semibold text-white">Recent Deals</div>
          <button className="text-[11px] text-blue-300">View all</button>
        </div>
        <div className="space-y-2">
          {recentDeals.map((deal, i) => (
            <motion.button
              key={deal.id}
              type="button"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 + 0.55, duration: 0.25 }}
              className="flex w-full items-center gap-3 rounded-[14px] border border-white/[0.07] bg-white/[0.025] p-3 transition active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-400/20 bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-[16px]">
                {flagFor(deal.buyer)}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-2">
                  <div className="truncate text-[12px] font-semibold text-white">{deal.id}</div>
                  <StatusBadge status={deal.status} compact />
                </div>
                <div className="mt-0.5 truncate text-[10px] text-slate-400">
                  {deal.buyer.split(" ")[0]} → {deal.seller.split(" ")[0]}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[12px] font-semibold text-white">{deal.amount}</div>
                <div className="text-[9px] text-slate-500">{deal.progress}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.35 }}
        className="overflow-hidden rounded-[18px] border border-white/[0.08] bg-[linear-gradient(165deg,rgba(8,20,52,0.7)_0%,rgba(4,12,32,0.85)_100%)]"
      >
        <div className="relative border-b border-white/[0.06] px-4 py-3">
          <div className="pointer-events-none absolute inset-x-[20%] top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(120,170,255,0.5),transparent)]" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Selected Deal</div>
              <div className="mt-0.5 display-font text-[1.4rem] font-semibold leading-none text-white">{selectedDeal.id}</div>
            </div>
            <StatusBadge status={selectedDeal.status} compact />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3">
          <div className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-500">Buyer</div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/15 text-[15px]">
                {flagFor(selectedDeal.buyer)}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[11px] font-semibold text-white">{selectedDeal.buyer}</div>
                <div className="truncate text-[9px] text-slate-400">{selectedDeal.buyerLocation}</div>
              </div>
            </div>
          </div>
          <div className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-500">Seller</div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/15 text-[15px]">
                {flagFor(selectedDeal.seller)}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[11px] font-semibold text-white">{selectedDeal.seller}</div>
                <div className="truncate text-[9px] text-slate-400">{selectedDeal.sellerLocation}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-white/[0.05] border-y border-white/[0.05]">
          <div className="px-4 py-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-500">Amount</div>
            <div className="mt-1 text-[14px] font-semibold text-white">{selectedDeal.amount}</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-500">Network</div>
            <div className="mt-1 flex items-center gap-1.5">
              <ArbitrumBadge size={14} />
              <span className="text-[12px] font-semibold text-white">Arbitrum Sepolia</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 px-4 py-3 text-[11px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Proof Submitted</span>
            <span className="flex items-center gap-1.5 text-white">
              <FileText className="h-3 w-3 text-slate-400" />
              {selectedDeal.proofFile}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Proof Status</span>
            <span className="flex items-center gap-1 text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              {selectedDeal.proofStatus}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Last Update</span>
            <span className="text-white">{fullTimestamp(selectedDeal.updated)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">TX Hash</span>
            {selectedDealTxUrl ? (
              <a href={selectedDealTxUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-mono text-blue-300 hover:text-blue-200">
                {shortenHash(selectedDeal.txHash)}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="text-slate-400">{selectedDeal.txHash}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-white/[0.06] p-3">
          <ActionButton
            tone="green"
            label="Release"
            icon={Lock}
            small
            onClick={() => void releaseFundsForDeal(selectedDeal)}
            disabled={!walletState.isConnected || !walletState.isCorrectNetwork || !walletState.contractReady}
          />
          <ActionButton
            tone="orange"
            label="Dispute"
            icon={ShieldAlert}
            outlined
            small
            onClick={() => void openDisputeForDeal(selectedDeal)}
            disabled={!walletState.isConnected || !walletState.isCorrectNetwork || !walletState.contractReady}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.35 }}
        className="relative overflow-hidden rounded-[18px] border border-white/[0.08] bg-white/[0.025] p-4"
      >
        <div className="pointer-events-none absolute inset-x-[20%] top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(120,170,255,0.5),transparent)]" />
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[13px] font-semibold text-white">Escrow Overview</div>
          <button className="text-[10px] text-blue-300">View details</button>
        </div>
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.65, rotate: -45 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.85 }}
            className="relative h-[124px] w-[124px] shrink-0 rounded-full p-4"
            style={{ background: mobileDonutGradient }}
          >
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#060f1e] px-2 text-center">
              <div className="display-font text-[12px] font-semibold leading-tight text-white">{compactUsd(mobileTotalVolume)}</div>
              <div className="mt-0.5 text-[8px] leading-none text-slate-400">Total Volume</div>
            </div>
          </motion.div>
          <div className="min-w-0 flex-1 space-y-2 text-[10px]">
            {mobileEscrowBreakdown.map((item) => (
              <div key={item.label} className="flex items-start gap-2">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-[2px] ${item.dot}`} />
                <div className="min-w-0">
                  <div className="truncate text-[10px] font-medium text-white">{item.label}</div>
                  <div className="text-[9px] text-slate-400">
                    {compactUsd(item.value)} ({mobileTotalVolume === 0 ? 0 : Math.round((item.value / mobileTotalVolume) * 100)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.78, duration: 0.35 }}
        className="overflow-hidden rounded-[18px] border border-white/[0.08] bg-white/[0.025]"
      >
        <div className="relative flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="pointer-events-none absolute inset-x-[20%] top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(120,170,255,0.5),transparent)]" />
          <div className="text-[13px] font-semibold text-white">Cross-Border Network</div>
          <span className="text-[9px] font-semibold tracking-widest text-blue-300">6 ACTIVE</span>
        </div>
        <div className="relative h-[140px] overflow-hidden bg-[linear-gradient(180deg,rgba(4,10,28,0.6),rgba(2,6,18,0.8))]">
          <div className="absolute inset-0 world-grid opacity-25" />
          <svg viewBox="0 0 100 65" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
            {[
              { from: { x: 76, y: 58 }, to: { x: 62, y: 45 }, color: "#3b82f6", dur: "3s" },
              { from: { x: 76, y: 58 }, to: { x: 79, y: 42 }, color: "#10b981", dur: "3.5s" },
              { from: { x: 62, y: 45 }, to: { x: 51.5, y: 28 }, color: "#8b5cf6", dur: "4s" },
              { from: { x: 79, y: 42 }, to: { x: 51.5, y: 28 }, color: "#06b6d4", dur: "2.8s" },
              { from: { x: 51.5, y: 28 }, to: { x: 23, y: 33 }, color: "#f59e0b", dur: "3.8s" },
              { from: { x: 82, y: 36 }, to: { x: 51.5, y: 28 }, color: "#6366f1", dur: "3.2s" },
            ].map(({ from, to, color, dur }, i) => {
              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2 - Math.abs(to.x - from.x) * 0.22;
              const d = `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
              const id = `marc-${i}`;
              return (
                <g key={i}>
                  <path id={id} d={d} fill="none" stroke={color} strokeWidth="0.22" strokeOpacity="0.25" />
                  <circle r="0.85" fill={color} fillOpacity="0.9">
                    <animateMotion dur={dur} repeatCount="indefinite">
                      <mpath href={`#${id}`} />
                    </animateMotion>
                  </circle>
                </g>
              );
            })}
            {[
              { name: "Singapore", x: 76, y: 58 },
              { name: "Dubai", x: 62, y: 45 },
              { name: "Shenzhen", x: 79, y: 42 },
              { name: "Frankfurt", x: 51.5, y: 28 },
              { name: "New York", x: 23, y: 33 },
              { name: "Seoul", x: 82, y: 36 },
            ].map((city, i) => (
              <g key={city.name}>
                <circle cx={city.x} cy={city.y} r="2.5" fill="none" stroke="white" strokeWidth="0.18" strokeOpacity="0.12">
                  <animate attributeName="r" values="2.5;4.6;2.5" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.12;0;0.12" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                </circle>
                <circle cx={city.x} cy={city.y} r="0.95" fill="white" fillOpacity="0.85" />
              </g>
            ))}
          </svg>
          <div className="absolute bottom-2 left-3 flex flex-wrap gap-2 pr-3">
            {["SINGAPORE", "DUBAI", "SHENZHEN", "FRANKFURT", "NEW YORK", "SEOUL"].map((name) => (
              <span key={name} className="text-[8px] font-medium tracking-widest text-slate-500">
                {name}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="text-[14px] font-semibold text-white">Recent Activity</div>
          <button className="text-[11px] text-blue-300">View all</button>
        </div>
        <div className="space-y-2">
          {activityRows.map(([title, body, time, tone], i) => (
            <motion.div
              key={`${title}-${time}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 + 0.75, duration: 0.25 }}
              className="flex items-start justify-between gap-3 rounded-[12px] border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={`mt-0.5 shrink-0 rounded-full border p-1.5 ${
                    tone === "green"
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                      : tone === "orange"
                        ? "border-orange-400/30 bg-orange-500/10 text-orange-300"
                        : "border-blue-400/30 bg-blue-500/10 text-blue-300"
                  }`}
                >
                  {tone === "green" ? (
                    <WalletCards className="h-3 w-3" />
                  ) : tone === "orange" ? (
                    <ShieldAlert className="h-3 w-3" />
                  ) : (
                    <FileText className="h-3 w-3" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-white">{title}</div>
                  <div className="truncate text-[9px] leading-4 text-slate-400">{body}</div>
                </div>
              </div>
              <div className="shrink-0 text-[9px] text-slate-500">{time}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.05, duration: 0.3 }}
        className="flex items-center gap-3 rounded-[14px] border border-emerald-400/15 bg-[linear-gradient(135deg,rgba(16,185,129,0.1),rgba(8,18,42,0.6))] p-3"
      >
        <ArbitrumBadge size={28} />
        <div className="flex-1">
          <div className="text-[11px] font-semibold text-white">Arbitrum Sepolia</div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Operational · 0.2s avg block
          </div>
        </div>
        <div className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold tracking-widest text-emerald-300">
          ALL GOOD
        </div>
      </motion.div>
    </div>
  );
}
