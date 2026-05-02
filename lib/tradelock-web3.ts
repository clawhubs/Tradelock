import {
  createPublicClient,
  createWalletClient,
  custom,
  erc20Abi,
  formatUnits,
  getAddress,
  http,
  isAddress,
  parseUnits,
  type Address,
} from "viem";
import { arbitrumSepolia } from "viem/chains";
import { tradeLockEscrowAbi } from "@/lib/abi/tradelock-escrow";

const configuredChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? arbitrumSepolia.id);
const configuredRpcUrl = process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC ?? arbitrumSepolia.rpcUrls.default.http[0];
const configuredSettlementToken = process.env.NEXT_PUBLIC_USDC_ADDRESS;
const configuredEscrowContract = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS;

export type BrowserEthereumProvider = {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: BrowserEthereumProvider;
  }
}

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(configuredRpcUrl),
});

function trimFormattedValue(value: string) {
  if (!value.includes(".")) {
    return value;
  }

  return value.replace(/\.?0+$/, "");
}

export function getInjectedProvider() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.ethereum ?? null;
}

export function getConfiguredChainId() {
  return configuredChainId;
}

export function getConfiguredRpcUrl() {
  return configuredRpcUrl;
}

export function getSettlementTokenAddress() {
  return isAddress(configuredSettlementToken ?? "") ? getAddress(configuredSettlementToken as Address) : undefined;
}

export function formatSettlementAmount(amountRaw: string, decimals = 6) {
  const normalized = amountRaw.replace(/,/g, "");
  return parseUnits(normalized, decimals);
}

export function getEscrowContractAddress() {
  return isAddress(configuredEscrowContract ?? "") ? getAddress(configuredEscrowContract as Address) : undefined;
}

export function isEscrowContractConfigured() {
  return Boolean(getEscrowContractAddress());
}

export function getShortAddress(address?: string) {
  if (!address) {
    return "Not connected";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function resolveChainName(chainId?: number) {
  if (!chainId) {
    return "Arbitrum Sepolia";
  }

  if (chainId === configuredChainId) {
    return "Arbitrum Sepolia";
  }

  if (chainId === 11155111) {
    return "Ethereum Sepolia";
  }

  return `Chain ${chainId}`;
}

export function formatWalletError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "Unexpected wallet error.";
}

export async function getWalletSnapshot(address: Address, chainId?: number) {
  const nativeBalance = await publicClient.getBalance({ address });
  const settlementTokenAddress = getSettlementTokenAddress();
  let settlementBalance = "0";
  let settlementSymbol = "tUSD";

  if (settlementTokenAddress) {
    const [balanceResult, symbolResult, decimalsResult] = await Promise.allSettled([
      publicClient.readContract({
        address: settlementTokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      }),
      publicClient.readContract({
        address: settlementTokenAddress,
        abi: erc20Abi,
        functionName: "symbol",
      }),
      publicClient.readContract({
        address: settlementTokenAddress,
        abi: erc20Abi,
        functionName: "decimals",
      }),
    ]);

    if (symbolResult.status === "fulfilled") {
      settlementSymbol = symbolResult.value;
    }

    if (balanceResult.status === "fulfilled") {
      const decimals = decimalsResult.status === "fulfilled" ? Number(decimalsResult.value) : 6;
      settlementBalance = trimFormattedValue(formatUnits(balanceResult.value, decimals));
    }
  }

  return {
    address,
    shortAddress: getShortAddress(address),
    chainId,
    chainName: resolveChainName(chainId),
    nativeBalance: trimFormattedValue(formatUnits(nativeBalance, 18)),
    settlementBalance,
    settlementSymbol,
    isConnected: true,
    isCorrectNetwork: chainId === configuredChainId,
    contractAddress: getEscrowContractAddress(),
    contractReady: isEscrowContractConfigured(),
    connectionLabel: chainId === configuredChainId ? "Connected" : "Switch Network",
  };
}

export async function switchToConfiguredChain(provider: BrowserEthereumProvider) {
  const chainHex = `0x${configuredChainId.toString(16)}`;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainHex }],
    });
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error && typeof error.code === "number" ? error.code : undefined;

    if (code !== 4902) {
      throw error;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainHex,
          chainName: "Arbitrum Sepolia",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: [configuredRpcUrl],
          blockExplorerUrls: ["https://sepolia.arbiscan.io"],
        },
      ],
    });
  }
}

export async function writeEscrowContract({
  provider,
  functionName,
  args,
}: {
  provider: BrowserEthereumProvider;
  functionName: "createDeal" | "fundDeal" | "submitProofHash" | "releaseFunds" | "openDispute" | "freezeDeal" | "cancelDeal";
  args: readonly unknown[];
}) {
  const contractAddress = getEscrowContractAddress();

  if (!contractAddress) {
    throw new Error("Escrow contract address is not configured yet.");
  }

  const walletClient = createWalletClient({
    chain: arbitrumSepolia,
    transport: custom(provider),
  });
  const [account] = await walletClient.getAddresses();

  if (!account) {
    throw new Error("No active wallet account was found.");
  }

  return walletClient.writeContract({
    address: contractAddress,
    abi: tradeLockEscrowAbi,
    functionName,
    args,
    account,
  } as never);
}

export async function approveSettlementToken({
  provider,
  spender,
  amount,
}: {
  provider: BrowserEthereumProvider;
  spender: Address;
  amount: bigint;
}) {
  const settlementTokenAddress = getSettlementTokenAddress();

  if (!settlementTokenAddress) {
    throw new Error("Settlement token address is not configured yet.");
  }

  const walletClient = createWalletClient({
    chain: arbitrumSepolia,
    transport: custom(provider),
  });
  const [account] = await walletClient.getAddresses();

  if (!account) {
    throw new Error("No active wallet account was found.");
  }

  return walletClient.writeContract({
    address: settlementTokenAddress,
    abi: erc20Abi,
    functionName: "approve",
    args: [spender, amount],
    account,
  });
}
