import { NextRequest, NextResponse } from "next/server";

import { isAutomationAuthorized } from "@/lib/automation-auth";
import { getCustodialSummary, reconcileImportedWallets } from "@/lib/custodial-engine";
import { loadImportedWalletInputs } from "@/lib/plan-wallet-parser";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!(await isAutomationAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const importedWallets = await loadImportedWalletInputs();
  const registry = await reconcileImportedWallets(importedWallets);
  const summary = summarize(registry);

  return NextResponse.json({ summary });
}

function summarize(registry: Awaited<ReturnType<typeof reconcileImportedWallets>>) {
  return {
    totalWallets: registry.wallets.length,
    activeWallets: registry.wallets.filter((wallet) => wallet.active).length,
    activeImported: registry.wallets.filter((wallet) => wallet.active && wallet.source === "imported").length,
  };
}

export async function GET(request: NextRequest) {
  if (!(await isAutomationAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await getCustodialSummary();
  return NextResponse.json({ summary });
}
