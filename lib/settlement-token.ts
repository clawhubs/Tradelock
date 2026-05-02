const configuredSymbol = process.env.NEXT_PUBLIC_SETTLEMENT_TOKEN_SYMBOL?.trim();

export const settlementTokenSymbol = configuredSymbol && configuredSymbol.length > 0 ? configuredSymbol : "tUSD";

export function withSettlementTokenSymbol(value: string) {
  return value.replace(/\bUSDC\b/g, settlementTokenSymbol);
}
