import { NextRequest, NextResponse } from "next/server";

import { createDeal, listDeals } from "@/lib/tradelock-backend";

export const dynamic = "force-dynamic";

export async function GET() {
  const deals = await listDeals();
  return NextResponse.json({ deals });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const deal = await createDeal({
    buyer: typeof payload.buyer === "string" ? payload.buyer : undefined,
    buyerLocation: typeof payload.buyerLocation === "string" ? payload.buyerLocation : undefined,
    seller: typeof payload.seller === "string" ? payload.seller : undefined,
    sellerLocation: typeof payload.sellerLocation === "string" ? payload.sellerLocation : undefined,
    amountRaw: typeof payload.amountRaw === "string" ? payload.amountRaw : undefined,
    milestone: typeof payload.milestone === "string" ? payload.milestone : undefined,
    progress: typeof payload.progress === "string" ? payload.progress : undefined,
    proofFile: typeof payload.proofFile === "string" ? payload.proofFile : undefined,
    proofStatus: typeof payload.proofStatus === "string" ? payload.proofStatus as never : undefined,
    status: typeof payload.status === "string" ? payload.status as never : undefined,
    network: typeof payload.network === "string" ? payload.network : undefined,
  });

  return NextResponse.json({ deal }, { status: 201 });
}
