"use client";

import { Clock3, Filter, ShieldAlert, ShieldCheck, Upload } from "lucide-react";

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

export function DisputesDesktopScreen({
  selectedDispute,
  onSelectDispute,
}: {
  selectedDispute: Dispute;
  onSelectDispute: (id: string) => void;
}) {
  const { data } = useTradeLockData();
  const { disputeFilters, disputes, disputesStats } = data;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <StatGrid stats={disputesStats} columns="xl:grid-cols-5" compact />
        <Panel>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <FilterRow filters={disputeFilters} />
            <div className="flex flex-wrap gap-2">
              <ToolbarButton label="Filter" icon={Filter} />
              <ToolbarButton label="Export CSV" icon={Upload} />
              <ToolbarButton label="Date Range" icon={Clock3} />
            </div>
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
                {disputes.map((dispute) => (
                  <tr
                    key={dispute.id}
                    onClick={() => onSelectDispute(dispute.id)}
                    className={`cursor-pointer transition hover:bg-white/[0.03] ${selectedDispute.id === dispute.id ? "bg-blue-500/12 shadow-[inset_0_1px_0_rgba(96,165,250,0.12)]" : ""}`}
                  >
                    <td className="px-4 py-4 font-medium text-white">{dispute.id}</td>
                    <td className="px-4 py-4">{dispute.dealId}</td>
                    <td className="px-4 py-4">{dispute.buyer}</td>
                    <td className="px-4 py-4">{dispute.seller}</td>
                    <td className="px-4 py-4">
                      <div className="text-slate-200">{dispute.reason}</div>
                      <div className="mt-1 text-[10px] text-slate-500">{dispute.evidenceStatus}</div>
                    </td>
                    <td className="px-4 py-4 text-[11px] text-slate-300">{dispute.evidenceFiles.length} files</td>
                    <td className="px-4 py-4 font-medium text-white">{dispute.amount}</td>
                    <td className="px-4 py-4"><StatusBadge status={dispute.status} compact /></td>
                    <td className="px-4 py-4 text-[11px] text-slate-400">{dispute.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager label={`Showing 1 to ${disputes.length} of ${disputes.length} disputes`} />
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
            <SummaryRow label="Buyer" value={selectedDispute.buyer} />
            <SummaryRow label="Seller" value={selectedDispute.seller} />
            <SummaryRow label="Amount in Dispute" value={selectedDispute.amount} emphasized />
          </div>
          <div className="space-y-3">
            <SummaryRow label="Evidence Status" value={selectedDispute.evidenceStatus} />
            <SummaryRow label="Evidence Files" value={`${selectedDispute.evidenceFiles.length} files`} />
            <SummaryRow label="TX Hash" value={selectedDispute.txHash} />
            <SummaryRow label="Last Update" value={selectedDispute.updated} />
          </div>
          <div className="grid gap-3">
            <ActionButton tone="green" label="Resolve & Release" icon={ShieldCheck} />
            <ActionButton tone="orange" label="Escalate to Arbitration" icon={ShieldAlert} outlined />
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
  const { disputes } = data;

  return (
    <div className="space-y-5">
      <MobilePageHeader title="Disputes" description="Review evidence and resolve frozen escrow flows." />
      <SearchField placeholder="Search disputes, deals..." />
      <FilterRow filters={["All", "Under Review", "Resolved"]} compact />
      <div className="space-y-3">
        {disputes.map((dispute) => (
          <MobileListCard
            key={dispute.id}
            active={selectedDispute.id === dispute.id}
            onClick={() => onSelectDispute(dispute.id)}
            title={dispute.id}
            subtitle={dispute.reason}
            badge={dispute.status}
            footer={`${dispute.amount} • ${dispute.updated}`}
          />
        ))}
      </div>
    </div>
  );
}
