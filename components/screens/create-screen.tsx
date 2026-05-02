"use client";

import { CheckCircle2, ChevronRight, FileBadge2, FileCheck2, HandCoins, ShieldAlert, TimerReset } from "lucide-react";

import { useTradeLockData } from "@/components/tradelock-data-provider";
import { ActionButton, MobilePageHeader, Panel, StatusBadge, SummaryRow } from "@/components/tradelock-ui";
import { settlementTokenSymbol } from "@/lib/settlement-token";

export function CreateDesktopScreen({ onCreated }: { onCreated?: (dealId: string) => void }) {
  const { data, createDemoDeal, isSyncing, walletState } = useTradeLockData();
  const { createFields, createSteps } = data;
  const createSections = [
    { title: "Deal Type", value: "Sale of Goods - Electronics", icon: FileBadge2 },
    { title: "Amount & Asset", value: `5,000 ${walletState.settlementSymbol} on Arbitrum Sepolia`, icon: HandCoins },
    { title: "Milestones", value: "3 milestones • 30% / 40% / 30%", icon: TimerReset },
    { title: "Proof Requirements", value: "Invoice, Packing List, Bill of Lading", icon: FileCheck2 },
    { title: "Dispute Rule", value: "Escalation + Arbitration (7 days)", icon: ShieldAlert },
    { title: "Review & Create", value: "Review details before deploying", icon: CheckCircle2 },
  ];

  async function handleCreate() {
    const deal = await createDemoDeal();

    if (deal) {
      onCreated?.(deal.id);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_336px]">
      <Panel title="Workflow Progress" action={<div className="text-[11px] text-blue-300">Step 1 / 7</div>} className="self-start xl:sticky xl:top-4">
        <div className="space-y-4">
          {createSteps.map((step, index) => (
            <div key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm ${index === 0 ? "border-blue-400/60 bg-blue-500/20 text-white" : "border-white/12 bg-white/[0.03] text-slate-300"}`}>
                  {index + 1}
                </div>
                {index < createSteps.length - 1 && <div className="mt-2 h-8 w-px bg-white/10" />}
              </div>
              <div>
                <div className="font-medium text-white">{step}</div>
                <div className="text-[11px] text-slate-400">Structured escrow flow</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel title="Counterparty Information" action={<StatusBadge status="Verified" compact />}>
          <div className="grid gap-3 sm:grid-cols-2">
            {createFields.map((field) => (
              <div key={`${field.label}-${field.value}`} className="rounded-[10px] border border-white/[0.08] bg-white/[0.025] p-3.5">
                <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{field.label}</div>
                <div className="mt-2 text-[13px] font-medium text-white">{field.value}</div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-3 xl:grid-cols-2">
          {createSections.map(({ title, value, icon: Icon }) => (
            <div key={title} className="glass-panel flex min-h-[102px] rounded-[10px] border border-white/[0.12] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-[10px] border border-blue-400/20 bg-blue-500/10 p-2.5">
                    <Icon className="h-4 w-4 text-blue-300" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{title}</div>
                    <div className="text-[12px] text-slate-400">{value}</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 self-start xl:sticky xl:top-4">
        <Panel title="Deal Summary" action={<StatusBadge status="Low Risk" compact />}>
          <div className="space-y-3 text-sm">
            <SummaryRow label="Deal Type" value="Sale of Goods" />
            <SummaryRow label="Settlement Asset" value={walletState.settlementSymbol} />
            <SummaryRow label="Network" value="Arbitrum Sepolia" />
            <SummaryRow label="Milestones" value="3 stages" />
            <SummaryRow label="Platform Fee (0.35%)" value={`17.50 ${walletState.settlementSymbol}`} />
            <SummaryRow label="Escrow Network Fee" value={`5.20 ${walletState.settlementSymbol}`} />
            <SummaryRow label="Total Fee" value={`22.70 ${walletState.settlementSymbol}`} emphasized />
          </div>
        </Panel>
        <Panel title="Deployment Readiness">
          <div className="space-y-3 text-sm">
            <SummaryRow label="Buyer Verified" value="Yes" />
            <SummaryRow label="Seller Verified" value="Yes" />
            <SummaryRow label="Dispute Rule" value="Configured" />
          </div>
        </Panel>
        <Panel title="Launch Checklist">
          <div className="space-y-3 text-sm">
            <SummaryRow label="Docs Attached" value="3 files" />
            <SummaryRow label="Funding Wallet" value={walletState.isConnected ? walletState.shortAddress : "Not connected"} />
            <SummaryRow label="Escrow Contract" value={walletState.contractReady ? "Configured" : "Pending"} />
          </div>
        </Panel>
        <ActionButton tone="blue" label={isSyncing ? "Creating..." : "Create Escrow Deal"} icon={CheckCircle2} onClick={handleCreate} />
      </div>
    </div>
  );
}

export function CreateMobileScreen({ onCreated }: { onCreated?: (dealId: string) => void }) {
  const { data, createDemoDeal, isSyncing } = useTradeLockData();
  const { createSteps } = data;

  async function handleCreate() {
    const deal = await createDemoDeal();

    if (deal) {
      onCreated?.(deal.id);
    }
  }

  return (
    <div className="space-y-5">
      <MobilePageHeader title="Create New Deal" description="Set up the escrow structure before deployment." />
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
        <div className="text-sm text-blue-200">Step 1 of 7</div>
        <div className="mt-1 text-lg font-semibold">Counterparty Setup</div>
      </div>
      <div className="space-y-3">
        {createSteps.slice(0, 5).map((step, index) => (
          <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${index === 0 ? "bg-blue-500 text-white" : "bg-white/5 text-slate-400"}`}>
              {index + 1}
            </div>
            <div>
              <div className="font-medium text-white">{step}</div>
              <div className="text-xs text-slate-400">Structured escrow flow</div>
            </div>
          </div>
        ))}
      </div>
        <Panel title="Review & Create">
        <div className="space-y-3 text-sm">
          <SummaryRow label="Buyer" value={data.createFields[0]?.value ?? "Configured Buyer"} />
          <SummaryRow label="Seller" value={data.createFields[4]?.value ?? "Configured Seller"} />
          <SummaryRow label="Amount" value={`5,000 ${settlementTokenSymbol}`} />
        </div>
      </Panel>
      <ActionButton tone="blue" label={isSyncing ? "Creating..." : "Create Escrow Deal"} icon={CheckCircle2} onClick={handleCreate} />
    </div>
  );
}
