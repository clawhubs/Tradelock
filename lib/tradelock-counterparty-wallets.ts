import { getAddress, isAddress, type Address } from "viem";

const counterpartyWalletEnvMap: Record<string, string | undefined> = {
  "GlobalImport Ltd.": process.env.NEXT_PUBLIC_BUYER_GLOBALIMPORT_ADDRESS,
  "Dubai Trade LLC": process.env.NEXT_PUBLIC_BUYER_DUBAI_TRADE_ADDRESS,
  "London Supply Partners": process.env.NEXT_PUBLIC_BUYER_LONDON_SUPPLY_ADDRESS,
  "Shenzhen Parts Co.": process.env.NEXT_PUBLIC_SELLER_SHENZHEN_ADDRESS,
  "Berlin Retail GmbH": process.env.NEXT_PUBLIC_SELLER_BERLIN_ADDRESS,
  "Ningbo Tech Ltd.": process.env.NEXT_PUBLIC_SELLER_NINGBO_ADDRESS,
  ARBITRATOR: process.env.NEXT_PUBLIC_ARBITRATOR_ADDRESS,
};

export function resolveCounterpartyWallet(
  name: string,
  fallbackAddress?: string,
): { address: Address; source: "directory" | "fallback" } | null {
  const configuredAddress = counterpartyWalletEnvMap[name];

  if (isAddress(configuredAddress ?? "")) {
    return { address: getAddress(configuredAddress as Address), source: "directory" };
  }

  if (isAddress(fallbackAddress ?? "")) {
    return { address: getAddress(fallbackAddress as Address), source: "fallback" };
  }

  return null;
}

export function createDealMetadataUri(dealId: string) {
  return `tradelock://deals/${dealId}`;
}
