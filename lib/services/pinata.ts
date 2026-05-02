import crypto from "node:crypto";

import { appEnv, hasPinataConfig } from "@/lib/env";

export async function uploadFileToPinata(file: File) {
  if (!hasPinataConfig()) {
    throw new Error("PINATA_JWT is not configured.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "pinataMetadata",
    JSON.stringify({
      name: file.name,
      keyvalues: {
        source: "TradeLock",
      },
    }),
  );

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${appEnv.pinataJwt!}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Pinata upload failed: ${response.status} ${detail}`);
  }

  const result = (await response.json()) as {
    IpfsHash: string;
    PinSize: number;
    Timestamp: string;
  };

  return {
    cid: result.IpfsHash,
    size: result.PinSize,
    timestamp: result.Timestamp,
  };
}

export async function createProofHash(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export async function getPinataHealth() {
  if (!hasPinataConfig()) {
    return { configured: false, healthy: false, detail: "PINATA_JWT is missing." };
  }

  try {
    const response = await fetch("https://api.pinata.cloud/data/testAuthentication", {
      headers: {
        Authorization: `Bearer ${appEnv.pinataJwt!}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();
      return { configured: true, healthy: false, detail };
    }

    return { configured: true, healthy: true, detail: "Pinata authentication passed." };
  } catch (error) {
    return {
      configured: true,
      healthy: false,
      detail: error instanceof Error ? error.message : "Unknown Pinata error.",
    };
  }
}
