"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  FileBadge2,
  FileSearch2,
  LayoutGrid,
  Plus,
  Search,
  Settings2,
  ShieldAlert,
  Users2,
  type LucideIcon,
} from "lucide-react";

import { useTradeLockData } from "@/components/tradelock-data-provider";
import type { ScreenKey } from "@/lib/types";

type CommandItem = {
  label: string;
  description: string;
  icon: LucideIcon;
  screen?: ScreenKey;
  category: "Navigation" | "Actions" | "Recent Deals";
};

const baseCommands: CommandItem[] = [
  { label: "Dashboard", description: "Global escrow overview", icon: LayoutGrid, screen: "dashboard", category: "Navigation" },
  { label: "Deals", description: "Manage all escrow agreements", icon: FileBadge2, screen: "deals", category: "Navigation" },
  { label: "Disputes", description: "Resolve escrow conflicts", icon: ShieldAlert, screen: "disputes", category: "Navigation" },
  { label: "Audit Trail", description: "Track on-chain events", icon: FileSearch2, screen: "audit", category: "Navigation" },
  { label: "Counterparties", description: "Manage trusted partners", icon: Users2, screen: "counterparties", category: "Navigation" },
  { label: "Settings", description: "Configure your workspace", icon: Settings2, screen: "settings", category: "Navigation" },
  { label: "Create New Deal", description: "Set up a new escrow agreement", icon: Plus, screen: "create", category: "Actions" },
];

export function CommandPalette({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (screen: ScreenKey) => void;
}) {
  const [query, setQuery] = useState("");
  const { data } = useTradeLockData();
  const recentDeals = data.deals.slice(0, 6).map((deal) => ({
    label: deal.id,
    description: `${deal.buyer} ↔ ${deal.seller} · $${deal.amountRaw} ${deal.amount.split(" ").at(-1) ?? ""}`.trim(),
    icon: FileBadge2,
    screen: "deals" as ScreenKey,
    category: "Recent Deals" as const,
  }));
  const commands = [...baseCommands, ...recentDeals];

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const filtered = query
    ? commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description.toLowerCase().includes(query.toLowerCase()),
      )
    : commands;

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-1/2 top-[15vh] z-[91] w-[92%] max-w-[640px] -translate-x-1/2"
          >
            <div className="glass-panel overflow-hidden rounded-[16px] border border-white/[0.12] shadow-[0_30px_100px_rgba(0,0,0,0.7)]">
              <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-4">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search deals, counterparties, screens..."
                  className="flex-1 bg-transparent text-[14px] text-white placeholder:text-slate-500 focus:outline-none"
                />
                <kbd className="rounded border border-white/[0.12] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-slate-400">ESC</kbd>
              </div>

              <div className="data-scroll max-h-[420px] overflow-y-auto p-2">
                {Object.entries(grouped).map(([category, items]) => (
                  <div key={category} className="mb-2 last:mb-0">
                    <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {category}
                    </div>
                    {items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={`${category}-${item.label}`}
                          onClick={() => {
                            if (item.screen) onNavigate(item.screen);
                            onClose();
                          }}
                          className="group flex w-full items-center gap-3 rounded-[10px] px-2 py-2.5 text-left transition hover:bg-white/[0.06]"
                        >
                          <div className="rounded-[8px] border border-blue-400/20 bg-blue-500/10 p-2">
                            <Icon className="h-3.5 w-3.5 text-blue-300" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-medium text-white">{item.label}</div>
                            <div className="truncate text-[11px] text-slate-400">{item.description}</div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-500 opacity-0 transition group-hover:opacity-100" />
                        </button>
                      );
                    })}
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="py-12 text-center text-[13px] text-slate-500">No results for &quot;{query}&quot;</div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.07] bg-white/[0.01] px-4 py-2.5 text-[10px] text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <kbd className="rounded border border-white/[0.12] bg-white/[0.04] px-1.5 py-0.5">↑↓</kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="rounded border border-white/[0.12] bg-white/[0.04] px-1.5 py-0.5">↵</kbd>
                    select
                  </span>
                </div>
                <span className="font-medium tracking-widest text-slate-600">TRADELOCK</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
