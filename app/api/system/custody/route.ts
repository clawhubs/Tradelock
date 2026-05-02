import { NextResponse } from "next/server";

import { getCustodialRegistry, getCustodialSummary } from "@/lib/custodial-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const [registry, summary] = await Promise.all([getCustodialRegistry(), getCustodialSummary()]);

  if (!registry) {
    return NextResponse.json({ registry: null, summary: null });
  }

  return NextResponse.json({
    summary,
    registry: {
      ...registry,
      wallets: registry.wallets.map((wallet) => ({
        ...wallet,
        encryptedPrivateKey: undefined,
      })),
    },
  });
}
