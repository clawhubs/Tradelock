"use client";

import { ExternalLink, Filter, Plus, Upload } from "lucide-react";

import type { Counterparty } from "@/lib/types";
import { useTradeLockData } from "@/components/tradelock-data-provider";
import {
  ActionButton,
  FilterRow,
  MobileListCard,
  MobilePageHeader,
  Pager,
  Panel,
  SearchField,
  StatGrid,
  StatusBadge,
  SummaryRow,
  ToolbarButton,
} from "@/components/tradelock-ui";
import { getAddressExplorerUrl, shortenHash } from "@/lib/explorer";

export function CounterpartiesDesktopScreen({
  selectedCounterparty,
  onSelectCounterparty,
}: {
  selectedCounterparty: Counterparty;
  onSelectCounterparty: (company: string) => void;
}) {
  const { data } = useTradeLockData();
  const { counterparties, counterpartyFilters, counterpartyStats } = data;
  const walletUrl = getAddressExplorerUrl(selectedCounterparty.wallet);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <StatGrid stats={counterpartyStats} columns="xl:grid-cols-5" compact />
        <Panel>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <FilterRow filters={counterpartyFilters} />
            <div className="flex flex-wrap gap-2">
              <ToolbarButton label="Filter" icon={Filter} />
              <ToolbarButton label="Export CSV" icon={Upload} />
              <ToolbarButton label="Invite" icon={Plus} />
            </div>
          </div>
          <div className="overflow-hidden rounded-[8px] border border-white/[0.08]">
            <table className="min-w-full text-left text-[12px]">
              <thead className="bg-white/[0.04] text-[10px] text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Counterparty</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Trust</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Escrow Volume</th>
                  <th className="px-4 py-3 font-medium">Last Deal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {counterparties.map((entry) => (
                  <tr
                    key={entry.company}
                    onClick={() => onSelectCounterparty(entry.company)}
                    className={`cursor-pointer transition hover:bg-white/[0.03] ${selectedCounterparty.company === entry.company ? "bg-blue-500/12 shadow-[inset_0_1px_0_rgba(96,165,250,0.12)]" : ""}`}
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{entry.company}</div>
                      <div className="text-[10px] text-slate-400">{entry.handle}</div>
                    </td>
                    <td className="px-4 py-4">{entry.role}</td>
                    <td className="px-4 py-4">{entry.location}</td>
                    <td className="px-4 py-4 font-medium text-white">{entry.trustScore}/100</td>
                    <td className="px-4 py-4"><StatusBadge status={entry.status} compact /></td>
                    <td className="px-4 py-4 text-slate-300">{entry.escrowVolume}</td>
                    <td className="px-4 py-4 text-[11px] text-slate-400">{entry.lastDeal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager label={`Showing 1 to ${counterparties.length} of ${counterparties.length} counterparties`} />
        </Panel>
      </div>

      <Panel title="Selected Counterparty" action={<StatusBadge status={selectedCounterparty.status} compact />} className="self-start xl:sticky xl:top-4">
        <div className="space-y-4 text-sm">
          <div className="rounded-[10px] border border-white/[0.08] bg-white/[0.025] p-3.5">
            <div className="display-font text-[1.5rem] font-semibold leading-tight text-white">{selectedCounterparty.company}</div>
            <div className="mt-1 text-[12px] text-slate-400">{selectedCounterparty.handle}</div>
          </div>
          <div className="space-y-3 border-y border-white/8 py-3">
            <SummaryRow label="Location" value={selectedCounterparty.location} />
            <SummaryRow label="Role" value={selectedCounterparty.role} />
            <SummaryRow label="Status" value={selectedCounterparty.status} />
            <SummaryRow label="Total Deals" value={`${selectedCounterparty.totalDeals}`} />
          </div>
          <div className="space-y-3">
            <SummaryRow label="Escrow Volume" value={selectedCounterparty.escrowVolume} emphasized />
            <SummaryRow
              label="Wallet"
              value={
                walletUrl ? (
                  <a href={walletUrl} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
                    {shortenHash(selectedCounterparty.wallet)}
                  </a>
                ) : (
                  selectedCounterparty.wallet
                )
              }
            />
            <SummaryRow label="Last Deal" value={selectedCounterparty.lastDeal} />
            <div className="space-y-2">
              <SummaryRow label="Trust Score" value={`${selectedCounterparty.trustScore}/100`} />
              <div className="h-1.5 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  style={{ width: `${selectedCounterparty.trustScore}%` }}
                />
              </div>
            </div>
          </div>
          <div className="grid gap-3">
            <ActionButton tone="blue" label="View Profile" icon={ExternalLink} onClick={() => walletUrl && window.open(walletUrl, "_blank", "noopener,noreferrer")} disabled={!walletUrl} />
          </div>
        </div>
      </Panel>
    </div>
  );
}

export function CounterpartiesMobileScreen({
  selectedCounterparty,
  onSelectCounterparty,
}: {
  selectedCounterparty: Counterparty;
  onSelectCounterparty: (company: string) => void;
}) {
  const { data } = useTradeLockData();
  const { counterparties } = data;

  return (
    <div className="space-y-5">
      <MobilePageHeader title="Counterparties" description="Browse trusted buyers and sellers." />
      <SearchField placeholder="Search counterparties..." />
      <FilterRow filters={["All", "Buyers", "Sellers", "Trusted"]} compact />
      <div className="space-y-3">
        {counterparties.slice(0, 5).map((entry) => (
          <MobileListCard
            key={entry.company}
            active={selectedCounterparty.company === entry.company}
            onClick={() => onSelectCounterparty(entry.company)}
            title={entry.company}
            subtitle={entry.location}
            badge={entry.status}
            footer={`${entry.totalDeals} deals • ${entry.escrowVolume}`}
          />
        ))}
      </div>
    </div>
  );
}
