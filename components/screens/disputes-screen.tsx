"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Filter, ShieldAlert, ShieldCheck, Upload } from "lucide-react";

import { downloadCsv } from "@/lib/browser-export";
import { getCountryFlag } from "@/lib/country-flags";
import { dateRangeLabels, isWithinDateRange, matchesQuery, nextDateRange, paginateItems, type DateRangeKey } from "@/lib/list-controls";
import type { Dispute } from "@/lib/types";
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
import { getTxExplorerUrl, shortenHash } from "@/lib/explorer";

export function DisputesDesktopScreen({
  selectedDispute,
  onSelectDispute,
}: {
  selectedDispute: Dispute;
  onSelectDispute: (id: string) => void;
}) {
  const { data } = useTradeLockData();
  const { deals, disputeFilters, disputes, disputesStats } = data;
  const [activeFilter, setActiveFilter] = useState(disputeFilters[0] ?? "All");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeKey>("all");
  const [evidenceOnly, setEvidenceOnly] = useState(false);
  const [page, setPage] = useState(1);
  const dealById = useMemo(() => new Map(deals.map((deal) => [deal.id, deal])), [deals]);
  const filteredDisputes = useMemo(
    () =>
      disputes.filter((dispute) => {
        const matchesFilter =
          activeFilter === "All"
            ? true
            : activeFilter === "Under Review"
              ? dispute.status === "Under Review"
              : activeFilter === "Evidence Submitted"
                ? dispute.evidenceStatus === "Evidence Submitted"
                : activeFilter === "Resolved"
                  ? dispute.status === "Resolved"
                  : activeFilter === "Archived"
                    ? dispute.status === "Archived"
                    : dispute.status === "Under Review";

        return (
          matchesFilter &&
          matchesQuery([dispute.id, dispute.dealId, dispute.buyer, dispute.seller, dispute.reason, dispute.txHash], searchQuery) &&
          isWithinDateRange(dispute.updated, dateRange) &&
          (!evidenceOnly || dispute.evidenceStatus === "Evidence Submitted" || dispute.evidenceFiles.length > 0)
        );
      }),
    [activeFilter, dateRange, disputes, evidenceOnly, searchQuery],
  );
  const paginatedDisputes = useMemo(() => paginateItems(filteredDisputes, page, 8), [filteredDisputes, page]);
  const txUrl = getTxExplorerUrl(selectedDispute.txHash);
  const selectedDisputeDeal = dealById.get(selectedDispute.dealId);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, dateRange, evidenceOnly, searchQuery]);

  useEffect(() => {
    if (!filteredDisputes.some((dispute) => dispute.id === selectedDispute.id) && filteredDisputes[0]) {
      onSelectDispute(filteredDisputes[0].id);
    }
  }, [filteredDisputes, onSelectDispute, selectedDispute.id]);

  function exportDisputesCsv() {
    downloadCsv(
      "tradelock-disputes.csv",
      ["Dispute ID", "Deal ID", "Buyer", "Seller", "Reason", "Evidence Status", "Amount", "Status", "Updated", "TX Hash"],
      filteredDisputes.map((dispute) => [
        dispute.id,
        dispute.dealId,
        dispute.buyer,
        dispute.seller,
        dispute.reason,
        dispute.evidenceStatus,
        dispute.amount,
        dispute.status,
        dispute.updated,
        dispute.txHash,
      ]),
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <StatGrid stats={disputesStats} columns="xl:grid-cols-5" compact />
        <Panel>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <FilterRow filters={disputeFilters} activeFilter={activeFilter} onSelect={setActiveFilter} />
            <div className="flex flex-wrap gap-2">
              <ToolbarButton label={evidenceOnly ? "Evidence Only" : "All Disputes"} icon={Filter} onClick={() => setEvidenceOnly((value) => !value)} />
              <ToolbarButton label="Export CSV" icon={Upload} onClick={exportDisputesCsv} disabled={filteredDisputes.length === 0} />
              <ToolbarButton label={dateRangeLabels[dateRange]} icon={Clock3} onClick={() => setDateRange((value) => nextDateRange(value))} />
            </div>
          </div>
          <div className="mb-3">
            <SearchField placeholder="Search disputes, deals, parties..." value={searchQuery} onChange={setSearchQuery} />
          </div>
          <div className="data-scroll overflow-auto rounded-[8px] border border-white/[0.08]">
            <table className="min-w-[1100px] text-left text-[12px]">
              <thead className="bg-white/[0.04] text-[10px] text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Dispute ID</th>
                  <th className="px-4 py-3 font-medium">Deal ID</th>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Seller</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Evidence</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedDisputes.items.map((dispute) => (
                  (() => {
                    const disputeDeal = dealById.get(dispute.dealId);
                    return (
                  <tr
                    key={dispute.id}
                    onClick={() => onSelectDispute(dispute.id)}
                    className={`cursor-pointer transition hover:bg-white/[0.03] ${selectedDispute.id === dispute.id ? "bg-blue-500/12 shadow-[inset_0_1px_0_rgba(96,165,250,0.12)]" : ""}`}
                  >
                    <td className="px-4 py-4 font-medium text-white">{dispute.id}</td>
                    <td className="px-4 py-4">{dispute.dealId}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span>{getCountryFlag(disputeDeal?.buyerLocation, dispute.buyer)}</span>
                        <span>{dispute.buyer}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span>{getCountryFlag(disputeDeal?.sellerLocation, dispute.seller)}</span>
                        <span>{dispute.seller}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-200">{dispute.reason}</div>
                      <div className="mt-1 text-[10px] text-slate-500">{dispute.evidenceStatus}</div>
                    </td>
                    <td className="px-4 py-4 text-[11px] text-slate-300">{dispute.evidenceFiles.length} files</td>
                    <td className="px-4 py-4 font-medium text-white">{dispute.amount}</td>
                    <td className="px-4 py-4"><StatusBadge status={dispute.status} compact /></td>
                    <td className="px-4 py-4 text-[11px] text-slate-400">{dispute.updated}</td>
                  </tr>
                    );
                  })()
                ))}
                {paginatedDisputes.items.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                      No disputes match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pager
            label={
              paginatedDisputes.totalItems === 0
                ? "Showing 0 disputes"
                : `Showing ${paginatedDisputes.startIndex + 1} to ${paginatedDisputes.endIndex} of ${paginatedDisputes.totalItems} disputes`
            }
            currentPage={paginatedDisputes.page}
            totalPages={paginatedDisputes.totalPages}
            onPageChange={setPage}
          />
        </Panel>
      </div>

      <Panel title="Dispute Summary" action={<StatusBadge status={selectedDispute.status} compact />} className="self-start xl:sticky xl:top-4">
        <div className="space-y-4 text-sm">
          <div className="rounded-[10px] border border-white/[0.08] bg-white/[0.025] p-3.5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Dispute ID</div>
            <div className="display-font mt-2 text-[1.65rem] font-semibold leading-none text-white">{selectedDispute.id}</div>
            <p className="mt-3 text-[12px] leading-5 text-slate-400">{selectedDispute.reason}</p>
          </div>
          <div className="space-y-3 border-y border-white/8 py-3">
            <SummaryRow label="Related Deal" value={selectedDispute.dealId} />
            <SummaryRow label="Buyer" value={<span>{getCountryFlag(selectedDisputeDeal?.buyerLocation, selectedDispute.buyer)} {selectedDispute.buyer}</span>} />
            <SummaryRow label="Seller" value={<span>{getCountryFlag(selectedDisputeDeal?.sellerLocation, selectedDispute.seller)} {selectedDispute.seller}</span>} />
            <SummaryRow label="Amount in Dispute" value={selectedDispute.amount} emphasized />
          </div>
          <div className="space-y-3">
            <SummaryRow label="Evidence Status" value={selectedDispute.evidenceStatus} />
            <SummaryRow label="Evidence Files" value={`${selectedDispute.evidenceFiles.length} files`} />
            <SummaryRow
              label="TX Hash"
              value={
                txUrl ? (
                  <a href={txUrl} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
                    {shortenHash(selectedDispute.txHash)}
                  </a>
                ) : (
                  selectedDispute.txHash
                )
              }
            />
            <SummaryRow label="Last Update" value={selectedDispute.updated} />
          </div>
          <div className="grid gap-3">
            <ActionButton tone="green" label="Resolve & Release" icon={ShieldCheck} disabled />
            <ActionButton tone="orange" label="Escalate to Arbitration" icon={ShieldAlert} outlined onClick={() => txUrl && window.open(txUrl, "_blank", "noopener,noreferrer")} disabled={!txUrl} />
          </div>
        </div>
      </Panel>
    </div>
  );
}

export function DisputesMobileScreen({
  selectedDispute,
  onSelectDispute,
}: {
  selectedDispute: Dispute;
  onSelectDispute: (id: string) => void;
}) {
  const { data } = useTradeLockData();
  const { deals, disputes, disputeFilters } = data;
  const [activeFilter, setActiveFilter] = useState(disputeFilters[0] ?? "All");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const dealById = useMemo(() => new Map(deals.map((deal) => [deal.id, deal])), [deals]);
  const filteredDisputes = useMemo(
    () =>
      disputes.filter((dispute) => {
        const matchesFilter =
          activeFilter === "All"
            ? true
            : activeFilter === "Under Review"
              ? dispute.status === "Under Review"
              : activeFilter === "Evidence Submitted"
                ? dispute.evidenceStatus === "Evidence Submitted"
                : activeFilter === "Resolved"
                  ? dispute.status === "Resolved"
                  : activeFilter === "Archived"
                    ? dispute.status === "Archived"
                    : dispute.status === "Under Review";

        return matchesFilter && matchesQuery([dispute.id, dispute.dealId, dispute.buyer, dispute.seller, dispute.reason], searchQuery);
      }),
    [activeFilter, disputes, searchQuery],
  );
  const paginatedDisputes = useMemo(() => paginateItems(filteredDisputes, page, 5), [filteredDisputes, page]);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, searchQuery]);

  return (
    <div className="space-y-5">
      <MobilePageHeader title="Disputes" description="Review evidence and resolve frozen escrow flows." />
      <SearchField placeholder="Search disputes, deals..." value={searchQuery} onChange={setSearchQuery} />
      <FilterRow filters={disputeFilters} compact activeFilter={activeFilter} onSelect={setActiveFilter} />
      <div className="space-y-3">
        {paginatedDisputes.items.map((dispute) => (
          (() => {
            const disputeDeal = dealById.get(dispute.dealId);
            return (
          <MobileListCard
            key={dispute.id}
            active={selectedDispute.id === dispute.id}
            onClick={() => onSelectDispute(dispute.id)}
            title={dispute.id}
            subtitle={<span>{getCountryFlag(disputeDeal?.buyerLocation, dispute.buyer)} {dispute.buyer} {" -> "} {getCountryFlag(disputeDeal?.sellerLocation, dispute.seller)} {dispute.seller}</span>}
            badge={dispute.status}
            footer={`${dispute.reason} • ${dispute.amount}`}
          />
            );
          })()
        ))}
      </div>
      <Pager
        label={
          paginatedDisputes.totalItems === 0
            ? "Showing 0 disputes"
            : `Showing ${paginatedDisputes.startIndex + 1} to ${paginatedDisputes.endIndex} of ${paginatedDisputes.totalItems} disputes`
        }
        currentPage={paginatedDisputes.page}
        totalPages={paginatedDisputes.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
