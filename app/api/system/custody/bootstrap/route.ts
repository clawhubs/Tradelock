import { NextRequest, NextResponse } from "next/server";

import { isAutomationAuthorized } from "@/lib/automation-auth";
import { bootstrapCustodialRegistry } from "@/lib/custodial-engine";
import { loadImportedWalletInputs } from "@/lib/plan-wallet-parser";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isAutomationAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as {
    targetUserCount?: number;
    dailyUserStartDate?: string;
  };

  const importedWallets = await loadImportedWalletInputs();
  const registry = await bootstrapCustodialRegistry({
    importedWallets,
    targetUserCount: payload.targetUserCount ?? 20,
    dailyUserStartDate: payload.dailyUserStartDate ?? "2026-05-13",
  });

  return NextResponse.json({
    summary: {
      totalWallets: registry.wallets.length,
      buyers: registry.wallets.filter((wallet) => wallet.role === "Buyer").length,
      sellers: registry.wallets.filter((wallet) => wallet.role === "Seller").length,
      arbitrators: registry.wallets.filter((wallet) => wallet.role === "Arbitrator").length,
      poolAddress: registry.pool.address,
    },
  });
}
