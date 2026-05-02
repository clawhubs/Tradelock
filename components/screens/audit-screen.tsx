"use client";

import { Clock3, ExternalLink, Filter, Upload } from "lucide-react";

import type { AuditEvent } from "@/lib/types";
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
import { getIpfsGatewayUrl, getTxExplorerUrl, shortenHash } from "@/lib/explorer";

export function AuditDesktopScreen({
  selectedEvent,
  onSelectEvent,
}: {
  selectedEvent: AuditEvent;
  onSelectEvent: (id: string) => void;
}) {
  const { data } = useTradeLockData();
  const { auditEvents, auditFilters, auditStats } = data;
  const txUrl = getTxExplorerUrl(selectedEvent.txHash);
  const proofUrl = getIpfsGatewayUrl(selectedEvent.proofHash);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <StatGrid stats={auditStats} columns="xl:grid-cols-5" compact />
        <Panel>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <FilterRow filters={auditFilters} />
            <div className="flex flex-wrap gap-2">
              <ToolbarButton label="Filter" icon={Filter} />
              <ToolbarButton label="Export CSV" icon={Upload} />
              <ToolbarButton label="Date Range" icon={Clock3} />
            </div>
          </div>
          <div className="data-scroll overflow-auto rounded-[8px] border border-white/[0.08]">
            <table className="min-w-[1140px] text-left text-[12px]">
              <thead className="bg-white/[0.04] text-[10px] text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Event ID</th>
                  <th className="px-4 py-3 font-medium">Deal ID</th>
                  <th className="px-4 py-3 font-medium">Event Type</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Block</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditEvents.map((event) => (
                  <tr
                    key={event.id}
                    onClick={() => onSelectEvent(event.id)}
                    className={`cursor-pointer transition hover:bg-white/[0.03] ${selectedEvent.id === event.id ? "bg-blue-500/12 shadow-[inset_0_1px_0_rgba(96,165,250,0.12)]" : ""}`}
                  >
                    <td className="px-4 py-4 font-medium text-white">{event.id}</td>
                    <td className="px-4 py-4">{event.dealId}</td>
                    <td className="px-4 py-4 text-slate-200">{event.type}</td>
                    <td className="px-4 py-4">{event.actor}</td>
                    <td className="px-4 py-4 text-slate-300">{event.asset}</td>
                    <td className="px-4 py-4 text-[11px] text-slate-400">{event.block}</td>
                    <td className="px-4 py-4"><StatusBadge status={event.status} compact /></td>
                    <td className="px-4 py-4 text-[11px] text-slate-400">{event.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager label={`Showing 1 to ${auditEvents.length} of ${auditEvents.length} events`} />
        </Panel>
      </div>

      <Panel title="Event Summary" action={<StatusBadge status={selectedEvent.status} compact />} className="self-start xl:sticky xl:top-4">
        <div className="space-y-3 text-sm">
          <div className="rounded-[10px] border border-white/[0.08] bg-white/[0.025] p-3.5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Event ID</div>
            <div className="display-font mt-2 text-[1.65rem] font-semibold leading-none text-white">{selectedEvent.id}</div>
            <div className="mt-3 text-[13px] text-slate-300">{selectedEvent.type}</div>
          </div>
          <div className="space-y-3 border-y border-white/8 py-3">
            <SummaryRow label="Related Deal" value={selectedEvent.dealId} />
            <SummaryRow label="Actor" value={selectedEvent.actor} />
            <SummaryRow label="Asset" value={selectedEvent.asset} />
          </div>
          <div className="space-y-3">
            <SummaryRow
              label="TX Hash"
              value={
                txUrl ? (
                  <a href={txUrl} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
                    {shortenHash(selectedEvent.txHash)}
                  </a>
                ) : (
                  selectedEvent.txHash
                )
              }
            />
            <SummaryRow label="Block" value={selectedEvent.block} />
            <SummaryRow label="Proof File" value={selectedEvent.proofFile ?? "N/A"} />
            <SummaryRow
              label="Proof Hash"
              value={
                proofUrl ? (
                  <a href={proofUrl} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
                    {shortenHash(selectedEvent.proofHash)}
                  </a>
                ) : (
                  selectedEvent.proofHash ?? "N/A"
                )
              }
            />
            <SummaryRow label="Timestamp" value={selectedEvent.timestamp} />
          </div>
          <div className="grid gap-3 pt-2">
            <ActionButton tone="blue" label="View on Arbiscan" icon={ExternalLink} onClick={() => txUrl && window.open(txUrl, "_blank", "noopener,noreferrer")} disabled={!txUrl} />
          </div>
        </div>
      </Panel>
    </div>
  );
}

export function AuditMobileScreen({
  selectedEvent,
  onSelectEvent,
}: {
  selectedEvent: AuditEvent;
  onSelectEvent: (id: string) => void;
}) {
  const { data } = useTradeLockData();
  const { auditEvents } = data;

  return (
    <div className="space-y-5">
      <MobilePageHeader title="Audit Trail" description="Track every event and proof hash on-chain." />
      <SearchField placeholder="Search events, deals..." />
      <FilterRow filters={["All", "Verified", "Releases"]} compact />
      <div className="space-y-3">
        {auditEvents.slice(0, 5).map((event) => (
          <MobileListCard
            key={event.id}
            active={selectedEvent.id === event.id}
            onClick={() => onSelectEvent(event.id)}
            title={event.id}
            subtitle={event.type}
            badge={event.status}
            footer={`${event.dealId} • ${event.timestamp}`}
          />
        ))}
      </div>
    </div>
  );
}
