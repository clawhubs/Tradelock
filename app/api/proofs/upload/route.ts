import { NextResponse } from "next/server";

import { createAuditEvent, getDeal, updateDeal } from "@/lib/tradelock-backend";
import { createProofHash, uploadFileToPinata } from "@/lib/services/pinata";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const fileEntry = formData.get("file");
  const dealId = formData.get("dealId");
  const actor = formData.get("actor");
  const asset = formData.get("asset");

  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const proofHash = await createProofHash(fileEntry);
  const pinata = await uploadFileToPinata(fileEntry);
  const dealIdValue = typeof dealId === "string" ? dealId : "DEAL-UNKNOWN";
  const existingDeal = await getDeal(dealIdValue);

  const updatedDeal = existingDeal
    ? await updateDeal(dealIdValue, {
        proofFile: fileEntry.name,
        proofHash,
        proofStatus: "Submitted",
        status: existingDeal.status === "Waiting Proof" || existingDeal.status === "Funded" ? "Active" : existingDeal.status,
      })
    : null;

  const auditEvent = await createAuditEvent({
    dealId: dealIdValue,
    type: "Proof Uploaded",
    actor: typeof actor === "string" ? actor : "TradeLock Operator",
    asset: typeof asset === "string" ? asset : existingDeal?.amount ?? "0.00 USDC",
    status: "Submitted",
    proofHash,
    proofFile: fileEntry.name,
  });

  return NextResponse.json({
    proof: {
      cid: pinata.cid,
      size: pinata.size,
      timestamp: pinata.timestamp,
      proofHash,
      fileName: fileEntry.name,
    },
    auditEvent,
    deal: updatedDeal,
  });
}
