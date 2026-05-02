import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";

import type { BootstrapWalletInput } from "@/lib/custodial-engine";

const importedWalletProfiles = [
  {
    envAddress: process.env.NEXT_PUBLIC_BUYER_GLOBALIMPORT_ADDRESS,
    role: "Buyer" as const,
    company: "GlobalImport Ltd.",
    handle: "@globalimport",
    countryCode: "SG",
    countryName: "Singapore",
    city: "Singapore",
    trustScore: 98,
    status: "Trusted" as const,
  },
  {
    envAddress: process.env.NEXT_PUBLIC_BUYER_DUBAI_TRADE_ADDRESS,
    role: "Buyer" as const,
    company: "Dubai Trade LLC",
    handle: "@dubaitrade",
    countryCode: "AE",
    countryName: "United Arab Emirates",
    city: "Dubai",
    trustScore: 95,
    status: "Trusted" as const,
  },
  {
    envAddress: process.env.NEXT_PUBLIC_BUYER_LONDON_SUPPLY_ADDRESS,
    role: "Buyer" as const,
    company: "London Supply Partners",
    handle: "@londonsupply",
    countryCode: "GB",
    countryName: "United Kingdom",
    city: "London",
    trustScore: 94,
    status: "Verified" as const,
  },
  {
    envAddress: process.env.NEXT_PUBLIC_SELLER_SHENZHEN_ADDRESS,
    role: "Seller" as const,
    company: "Shenzhen Parts Co.",
    handle: "@shenzhenparts",
    countryCode: "CN",
    countryName: "China",
    city: "Shenzhen",
    trustScore: 97,
    status: "Trusted" as const,
  },
  {
    envAddress: process.env.NEXT_PUBLIC_SELLER_BERLIN_ADDRESS,
    role: "Seller" as const,
    company: "Berlin Retail GmbH",
    handle: "@berlinretail",
    countryCode: "DE",
    countryName: "Germany",
    city: "Berlin",
    trustScore: 92,
    status: "Verified" as const,
  },
  {
    envAddress: process.env.NEXT_PUBLIC_SELLER_NINGBO_ADDRESS,
    role: "Seller" as const,
    company: "Ningbo Tech Ltd.",
    handle: "@ningbotech",
    countryCode: "CN",
    countryName: "China",
    city: "Ningbo",
    trustScore: 94,
    status: "Verified" as const,
  },
  {
    envAddress: process.env.NEXT_PUBLIC_ARBITRATOR_ADDRESS,
    role: "Arbitrator" as const,
    company: "TradeLock Arbitration Desk",
    handle: "@tradelockarb",
    countryCode: "CH",
    countryName: "Switzerland",
    city: "Geneva",
    trustScore: 99,
    status: "Trusted" as const,
  },
];

export async function loadImportedWalletInputs() {
  const planPath = join(process.cwd(), "Plan", "Akses Deploy");
  const contents = await readFile(planPath, "utf8");
  const withPrefix = [...new Set(contents.match(/0x[a-fA-F0-9]{64}\b/g) ?? [])];
  const bare = [...new Set(contents.match(/\b[a-fA-F0-9]{64}\b/g) ?? [])]
    .filter((value) => !withPrefix.some((entry) => entry.slice(2).toLowerCase() === value.toLowerCase()))
    .map((value) => `0x${value}`) as Hex[];
  const privateKeys = [...withPrefix, ...bare] as Hex[];

  const walletsByAddress = new Map(
    privateKeys.map((privateKey) => {
      const account = privateKeyToAccount(privateKey);
      return [account.address.toLowerCase(), privateKey] as const;
    }),
  );

  const inputs: BootstrapWalletInput[] = [];

  for (const profile of importedWalletProfiles) {
    if (!profile.envAddress) {
      continue;
    }

    const privateKey = walletsByAddress.get(profile.envAddress.toLowerCase());

    if (!privateKey) {
      continue;
    }

    inputs.push({
      privateKey,
      role: profile.role,
      company: profile.company,
      handle: profile.handle,
      countryCode: profile.countryCode,
      countryName: profile.countryName,
      city: profile.city,
      trustScore: profile.trustScore,
      status: profile.status,
    });
  }

  return inputs;
}
