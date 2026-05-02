"use client";

import { Clock3, Filter, Plus, Upload } from "lucide-react";

import type { Deal } from "@/lib/types";
import { useTradeLockData } from "@/components/tradelock-data-provider";
import {
  ActionButton,
  DealSummaryCard,
  FilterRow,
  MobileListCard,
  MobilePageHeader,
  Pager,
  Panel,
  SearchField,
  StatGrid,
  StatusBadge,
  ToolbarButton,
  progressWidth,
} from "@/components/tradelock-ui";

export function DealsDesktopScreen({
  selectedDeal,
  onSelectDeal,
}: {
  selectedDeal: Deal;
  onSelectDeal: (id: string) => void;
}) {
  const {
    data,
    uploadProofForDeal,
    isUploadingProof,
    walletState,
    approveSettlementForDeal,
    fundEscrowForDeal,
    releaseFundsForDeal,
    openDisputeForDeal,
    isDealActionPending,
  } = useTradeLockData();
  const { dealFilters, deals, dealsStats } = data;
  const walletReady = walletState.isConnected && walletState.isCorrectNetwork && walletState.contractReady;
  const canApprove = walletReady && selectedDeal.status === "Active" && selectedDeal.progress === "0/3";
  const canFund = walletReady && selectedDeal.status === "Active" && selectedDeal.progress === "0/3";
  const canUploadProof = walletReady && (selectedDeal.status === "Funded" || selectedDeal.status === "Active" || selectedDeal.status === "Waiting Proof");
  const canRelease = walletReady && (selectedDeal.status === "Funded" || selectedDeal.status === "Proof Verified" || selectedDeal.status === "Ready to Release");
  const canDispute = walletReady && (selectedDeal.status === "Funded" || selectedDeal.status === "Proof Verified" || selectedDeal.status === "Ready to Release" || selectedDeal.status === "Active");

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <StatGrid stats={dealsStats} columns="xl:grid-cols-5" compact />

        <Panel>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <FilterRow filters={dealFilters} />
            <div className="flex flex-wrap gap-2">
              <ToolbarButton label="Filter" icon={Filter} />
              <ToolbarButton label="Export CSV" icon={Upload} />
              <ToolbarButton label="Date Range" icon={Clock3} />
            </div>
          </div>

          <div className="data-scroll overflow-auto rounded-[8px] border border-white/[0.08]">
            <table className="min-w-[1080px] text-left text-[12px]">
              <thead className="bg-white/[0.04] text-[10px] text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Deal ID</th>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Seller</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Milestone</th>
                  <th className="px-4 py-3 font-medium">Proof Status</th>
                  <th className="px-4 py-3 font-medium">Deal Status</th>
                  <th className="px-4 py-3 font-medium">Network</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {deals.map((deal) => (
                  <tr
                    key={deal.id}
                    onClick={() => onSelectDeal(deal.id)}
                    className={`cursor-pointer transition hover:bg-white/[0.03] ${
                      selectedDeal.id === deal.id ? "bg-blue-500/12 shadow-[inset_0_1px_0_rgba(96,165,250,0.12)]" : ""
                    }`}
                  >
                    <td className="px-4 py-4 font-medium text-white">{deal.id}</td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{deal.buyer}</div>
                      <div className="text-[10px] text-slate-400">{deal.buyerLocation}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{deal.seller}</div>
                      <div className="text-[10px] text-slate-400">{deal.sellerLocation}</div>
                    </td>
                    <td className="px-4 py-4 font-medium text-white">{deal.amountRaw}</td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{deal.progress}</div>
                      <div className="mt-2 h-1.5 rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${progressWidth(deal.progress)}%` }} />
                      </div>
                      <div className="mt-2 text-[10px] text-slate-400">{deal.milestone}</div>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={deal.proofStatus} compact /></td>
                    <td className="px-4 py-4"><StatusBadge status={deal.status} compact /></td>
                    <td className="px-4 py-4 text-[11px] text-slate-400">{deal.network}</td>
                    <td className="px-4 py-4 text-[11px] text-slate-400">{deal.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pager label={`Showing 1 to ${deals.length} of ${deals.length} deals`} />
        </Panel>
      </div>

      <DealSummaryCard
        deal={selectedDeal}
        className="self-start xl:sticky xl:top-4"
        approvePending={isDealActionPending(selectedDeal.id, "approve")}
        fundPending={isDealActionPending(selectedDeal.id, "fund")}
        uploadPending={isUploadingProof}
        releasePending={isDealActionPending(selectedDeal.id, "release")}
        disputePending={isDealActionPending(selectedDeal.id, "dispute")}
        approveDisabled={!canApprove}
        fundDisabled={!canFund}
        uploadDisabled={!canUploadProof}
        releaseDisabled={!canRelease}
        disputeDisabled={!canDispute}
        onApproveToken={() => void approveSettlementForDeal(selectedDeal)}
        onFundEscrow={() => void fundEscrowForDeal(selectedDeal)}
        onUploadProof={(file) =>
          uploadProofForDeal({
            dealId: selectedDeal.id,
            file,
            actor: selectedDeal.seller,
            asset: selectedDeal.amount,
          })
        }
        onReleaseFunds={() => void releaseFundsForDeal(selectedDeal)}
        onOpenDispute={() => void openDisputeForDeal(selectedDeal)}
      />
    </div>
  );
}

export function DealsMobileScreen({
  selectedDeal,
  onSelectDeal,
}: {
  selectedDeal: Deal;
  onSelectDeal: (id: string) => void;
}) {
  const {
    data,
    uploadProofForDeal,
    isUploadingProof,
    walletState,
    approveSettlementForDeal,
    fundEscrowForDeal,
    releaseFundsForDeal,
    isDealActionPending,
    openDisputeForDeal,
  } = useTradeLockData();
  const { deals } = data;
  const walletReady = walletState.isConnected && walletState.isCorrectNetwork && walletState.contractReady;
  const canApprove = walletReady && selectedDeal.status === "Active" && selectedDeal.progress === "0/3";
  const canFund = walletReady && selectedDeal.status === "Active" && selectedDeal.progress === "0/3";
  const canUploadProof = walletReady && (selectedDeal.status === "Funded" || selectedDeal.status === "Active" || selectedDeal.status === "Waiting Proof");
  const canRelease = walletReady && (selectedDeal.status === "Funded" || selectedDeal.status === "Proof Verified" || selectedDeal.status === "Ready to Release");
  const canDispute = walletReady && (selectedDeal.status === "Funded" || selectedDeal.status === "Proof Verified" || selectedDeal.status === "Ready to Release" || selectedDeal.status === "Active");

  return (
    <div className="space-y-5">
      <MobilePageHeader title="Deals" description="Search, filter, and review escrow deals." />
      <SearchField placeholder="Search deals, counterparties..." />
      <FilterRow filters={["All", "Active", "Disputed"]} compact />
      <div className="space-y-3">
        {deals.slice(0, 5).map((deal) => (
          <MobileListCard
            key={deal.id}
            active={selectedDeal.id === deal.id}
            onClick={() => onSelectDeal(deal.id)}
            title={deal.id}
            subtitle={`${deal.buyer} → ${deal.seller}`}
            badge={deal.status}
            footer={`${deal.progress} • ${deal.amount}`}
          />
        ))}
      </div>
      <Panel title="Selected Deal" action={<StatusBadge status={selectedDeal.status} compact />}>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div><div className="text-slate-400">Buyer</div><div className="mt-1 text-white">{selectedDeal.buyer}</div></div>
            <div><div className="text-slate-400">Seller</div><div className="mt-1 text-white">{selectedDeal.seller}</div></div>
            <div><div className="text-slate-400">Amount</div><div className="mt-1 text-white">{selectedDeal.amount}</div></div>
            <div><div className="text-slate-400">Network</div><div className="mt-1 text-white">{selectedDeal.network}</div></div>
          </div>
          <div className="grid gap-3 pt-1">
            <ActionButton
              tone="purple"
              label={isDealActionPending(selectedDeal.id, "approve") ? "Approving..." : "Approve Token"}
              icon={Plus}
              small
              disabled={!canApprove || isDealActionPending(selectedDeal.id, "approve")}
              onClick={() => void approveSettlementForDeal(selectedDeal)}
            />
            <ActionButton
              tone="green"
              label={isDealActionPending(selectedDeal.id, "fund") ? "Funding..." : "Fund Escrow"}
              icon={Plus}
              small
              disabled={!canFund || isDealActionPending(selectedDeal.id, "fund")}
              onClick={() => void fundEscrowForDeal(selectedDeal)}
            />
            <ActionButton
              tone="cyan"
              label={isUploadingProof ? "Uploading..." : "Upload Proof"}
              icon={Upload}
              small
              disabled={!canUploadProof || isUploadingProof}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.onchange = () => {
                  const file = input.files?.[0];
                  if (file) {
                    void uploadProofForDeal({
                      dealId: selectedDeal.id,
                      file,
                      actor: selectedDeal.seller,
                      asset: selectedDeal.amount,
                    });
                  }
                };
                input.click();
              }}
            />
            <ActionButton
              tone="green"
              label={isDealActionPending(selectedDeal.id, "release") ? "Releasing..." : "Release Funds"}
              icon={Plus}
              small
              disabled={!canRelease || isDealActionPending(selectedDeal.id, "release")}
              onClick={() => void releaseFundsForDeal(selectedDeal)}
            />
            <ActionButton
              tone="orange"
              label={isDealActionPending(selectedDeal.id, "dispute") ? "Opening..." : "Open Dispute"}
              icon={Plus}
              small
              outlined
              disabled={!canDispute || isDealActionPending(selectedDeal.id, "dispute")}
              onClick={() => void openDisputeForDeal(selectedDeal)}
            />
          </div>
        </div>
      </Panel>
    </div>
  );
}
