"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, ExternalLink, Filter, Upload } from "lucide-react";

import { downloadCsv } from "@/lib/browser-export";
import { getCountryFlag } from "@/lib/country-flags";
import { dateRangeLabels, isWithinDateRange, matchesQuery, nextDateRange, paginateItems, type DateRangeKey } from "@/lib/list-controls";
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
  const [activeFilter, setActiveFilter] = useState(counterpartyFilters[0] ?? "All");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeKey>("all");
  const [linkedDealsOnly, setLinkedDealsOnly] = useState(false);
  const [page, setPage] = useState(1);
  const filteredCounterparties = useMemo(
    () =>
      counterparties.filter((entry) => {
        const matchesFilter =
          activeFilter === "All"
            ? true
            : activeFilter === "Buyers"
              ? entry.role === "Buyer"
              : activeFilter === "Sellers"
                ? entry.role === "Seller"
                : activeFilter === "Trusted"
                  ? entry.status === "Trusted" || entry.status === "Verified"
                  : isWithinDateRange(entry.lastDeal, "30d");

        return (
          matchesFilter &&
          matchesQuery([entry.company, entry.handle, entry.role, entry.location, entry.wallet, entry.escrowVolume], searchQuery) &&
          (dateRange === "all" || isWithinDateRange(entry.lastDeal, dateRange)) &&
          (!linkedDealsOnly || entry.totalDeals > 0)
        );
      }),
    [activeFilter, counterparties, dateRange, linkedDealsOnly, searchQuery],
  );
  const paginatedCounterparties = useMemo(() => paginateItems(filteredCounterparties, page, 8), [filteredCounterparties, page]);
  const walletUrl = getAddressExplorerUrl(selectedCounterparty.wallet);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, dateRange, linkedDealsOnly, searchQuery]);

  useEffect(() => {
    if (!filteredCounterparties.some((entry) => entry.company === selectedCounterparty.company) && filteredCounterparties[0]) {
      onSelectCounterparty(filteredCounterparties[0].company);
    }
  }, [filteredCounterparties, onSelectCounterparty, selectedCounterparty.company]);

  function exportCounterpartiesCsv() {
    downloadCsv(
      "tradelock-counterparties.csv",
      ["Company", "Handle", "Role", "Location", "Trust Score", "Status", "Total Deals", "Escrow Volume", "Last Deal", "Wallet"],
      filteredCounterparties.map((entry) => [
        entry.company,
        entry.handle,
        entry.role,
        entry.location,
        entry.trustScore,
        entry.status,
        entry.totalDeals,
        entry.escrowVolume,
        entry.lastDeal,
        entry.wallet,
      ]),
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <StatGrid stats={counterpartyStats} columns="xl:grid-cols-5" compact />
        <Panel>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <FilterRow filters={counterpartyFilters} activeFilter={activeFilter} onSelect={setActiveFilter} />
            <div className="flex flex-wrap gap-2">
              <ToolbarButton label={linkedDealsOnly ? "Linked Deals Only" : "All Counterparties"} icon={Filter} onClick={() => setLinkedDealsOnly((value) => !value)} />
              <ToolbarButton label="Export CSV" icon={Upload} onClick={exportCounterpartiesCsv} disabled={filteredCounterparties.length === 0} />
              <ToolbarButton label={dateRangeLabels[dateRange]} icon={Clock3} onClick={() => setDateRange((value) => nextDateRange(value))} />
            </div>
          </div>
          <div className="mb-3">
            <SearchField placeholder="Search companies, handles, wallets..." value={searchQuery} onChange={setSearchQuery} />
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
                {paginatedCounterparties.items.map((entry) => (
                  <tr
                    key={entry.company}
                    onClick={() => onSelectCounterparty(entry.company)}
                    className={`cursor-pointer transition hover:bg-white/[0.03] ${selectedCounterparty.company === entry.company ? "bg-blue-500/12 shadow-[inset_0_1px_0_rgba(96,165,250,0.12)]" : ""}`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 font-medium text-white">
                        <span>{getCountryFlag(entry.location, entry.company)}</span>
                        <span>{entry.company}</span>
                      </div>
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
                {paginatedCounterparties.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                      No counterparties match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pager
            label={
              paginatedCounterparties.totalItems === 0
                ? "Showing 0 counterparties"
                : `Showing ${paginatedCounterparties.startIndex + 1} to ${paginatedCounterparties.endIndex} of ${paginatedCounterparties.totalItems} counterparties`
            }
            currentPage={paginatedCounterparties.page}
            totalPages={paginatedCounterparties.totalPages}
            onPageChange={setPage}
          />
        </Panel>
      </div>

      <Panel title="Selected Counterparty" action={<StatusBadge status={selectedCounterparty.status} compact />} className="self-start xl:sticky xl:top-4">
        <div className="space-y-4 text-sm">
          <div className="rounded-[10px] border border-white/[0.08] bg-white/[0.025] p-3.5">
            <div className="display-font text-[1.5rem] font-semibold leading-tight text-white">
              {getCountryFlag(selectedCounterparty.location, selectedCounterparty.company)} {selectedCounterparty.company}
            </div>
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
  const { counterparties, counterpartyFilters } = data;
  const [activeFilter, setActiveFilter] = useState(counterpartyFilters[0] ?? "All");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const filteredCounterparties = useMemo(
    () =>
      counterparties.filter((entry) => {
        const matchesFilter =
          activeFilter === "All"
            ? true
            : activeFilter === "Buyers"
              ? entry.role === "Buyer"
              : activeFilter === "Sellers"
                ? entry.role === "Seller"
                : activeFilter === "Trusted"
                  ? entry.status === "Trusted" || entry.status === "Verified"
                  : isWithinDateRange(entry.lastDeal, "30d");

        return matchesFilter && matchesQuery([entry.company, entry.handle, entry.location, entry.wallet], searchQuery);
      }),
    [activeFilter, counterparties, searchQuery],
  );
  const paginatedCounterparties = useMemo(() => paginateItems(filteredCounterparties, page, 5), [filteredCounterparties, page]);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, searchQuery]);

  return (
    <div className="space-y-5">
      <MobilePageHeader title="Counterparties" description="Browse trusted buyers and sellers." />
      <SearchField placeholder="Search counterparties..." value={searchQuery} onChange={setSearchQuery} />
      <FilterRow filters={counterpartyFilters} compact activeFilter={activeFilter} onSelect={setActiveFilter} />
      <div className="space-y-3">
        {paginatedCounterparties.items.map((entry) => (
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
      <Pager
        label={
          paginatedCounterparties.totalItems === 0
            ? "Showing 0 counterparties"
            : `Showing ${paginatedCounterparties.startIndex + 1} to ${paginatedCounterparties.endIndex} of ${paginatedCounterparties.totalItems} counterparties`
        }
        currentPage={paginatedCounterparties.page}
        totalPages={paginatedCounterparties.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
