"use client";

import { useEffect, useMemo, useState } from "react";

import {
  auditEvents,
  auditFilters,
  auditStats,
  counterpartyFilters,
  counterpartyStats,
  counterparties,
  createFields,
  createSteps,
  dealFilters,
  deals,
  dealsStats,
  disputeFilters,
  disputes,
  disputesStats,
  overviewStats,
  settingsCards,
} from "@/lib/mock-data";
import { createDealMetadataUri, resolveCounterpartyWallet } from "@/lib/tradelock-counterparty-wallets";
import { approveSettlementToken, formatSettlementAmount, getEscrowContractAddress, getInjectedProvider, getSettlementTokenAddress, getShortAddress, getWalletSnapshot, getConfiguredChainId, isEscrowContractConfigured, formatWalletError, resolveChainName, switchToConfiguredChain, writeEscrowContract } from "@/lib/tradelock-web3";
import type { CustodySnapshot, Deal, ScreenKey, SystemStatus, TradeLockAppState, WalletState } from "@/lib/types";
import { MobileLayout, DesktopLayout } from "@/components/tradelock-layout";
import { ToastProvider } from "@/components/toast-provider";
import { SplashScreen } from "@/components/splash-screen";
import { CommandPalette } from "@/components/command-palette";
import { TradeLockDataProvider } from "@/components/tradelock-data-provider";
import { DashboardDesktopScreen, DashboardMobileScreen } from "@/components/screens/dashboard-screen";
import { DealsDesktopScreen, DealsMobileScreen } from "@/components/screens/deals-screen";
import { CreateDesktopScreen, CreateMobileScreen } from "@/components/screens/create-screen";
import { DisputesDesktopScreen, DisputesMobileScreen } from "@/components/screens/disputes-screen";
import { AuditDesktopScreen, AuditMobileScreen } from "@/components/screens/audit-screen";
import { CounterpartiesDesktopScreen, CounterpartiesMobileScreen } from "@/components/screens/counterparties-screen";
import { SettingsDesktopScreen, SettingsMobileScreen } from "@/components/screens/settings-screen";
import { useToast } from "@/components/toast-provider";

const defaultAppState: TradeLockAppState = {
  dealFilters,
  disputeFilters,
  auditFilters,
  counterpartyFilters,
  deals,
  disputes,
  auditEvents,
  counterparties,
  overviewStats,
  dealsStats,
  disputesStats,
  auditStats,
  counterpartyStats,
  createSteps,
  createFields,
  settings: {
    cards: settingsCards,
    workspaceSummary: [
      { label: "Verified Business", value: "Verified" },
      { label: "Active Team Members", value: "12" },
      { label: "2FA Enabled", value: "Yes" },
      { label: "API Connected", value: "Yes" },
      { label: "Default Network", value: "Arbitrum Sepolia" },
      { label: "Notification Mode", value: "Daily Digest" },
      { label: "Workspace ID", value: "TLK-GIL-882312" },
    ],
    securitySummary: [
      { label: "Access Reviews", value: "Current" },
      { label: "Login Alerts", value: "Enabled" },
      { label: "Webhook Health", value: "Healthy" },
      { label: "Arbitration Policy", value: "Default" },
    ],
  },
};

const initialSystemStatus: SystemStatus = {
  services: {
    redis: { configured: false, healthy: false, detail: "Not checked yet." },
    pinata: { configured: false, healthy: false, detail: "Not checked yet." },
    supabase: { configured: false, healthy: false, detail: "Not checked yet." },
    persistence: { activeStore: "unavailable", healthy: false, detail: "Supabase status not checked yet." },
    custody: { configured: false, healthy: false, detail: "Custodial status not checked yet." },
  },
};

const defaultWalletState: WalletState = {
  shortAddress: "Not connected",
  chainName: "Arbitrum Sepolia",
  nativeBalance: "0",
  settlementBalance: "0",
  settlementSymbol: "tUSD",
  isConnected: false,
  isCorrectNetwork: false,
  contractAddress: getEscrowContractAddress(),
  contractReady: isEscrowContractConfigured(),
  connectionLabel: "Connect Wallet",
};

function parseScreenFromUrl(): ScreenKey {
  if (typeof window === "undefined") {
    return "dashboard";
  }

  const screen = new URLSearchParams(window.location.search).get("screen");

  if (
    screen === "dashboard" ||
    screen === "deals" ||
    screen === "create" ||
    screen === "disputes" ||
    screen === "audit" ||
    screen === "counterparties" ||
    screen === "settings"
  ) {
    return screen;
  }

  return "dashboard";
}

export function TradeLockApp() {
  return (
    <ToastProvider>
      <TradeLockShell />
    </ToastProvider>
  );
}

function TradeLockShell() {
  const { toast } = useToast();
  const [activeScreen, setActiveScreen] = useState<ScreenKey>(parseScreenFromUrl);
  const [data, setData] = useState<TradeLockAppState>(defaultAppState);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isWalletBusy, setIsWalletBusy] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(initialSystemStatus);
  const [custodySnapshot, setCustodySnapshot] = useState<CustodySnapshot | null>(null);
  const [walletState, setWalletState] = useState<WalletState>(defaultWalletState);
  const [walletManuallyDisconnected, setWalletManuallyDisconnected] = useState(false);
  const [dealActionState, setDealActionState] = useState<{ dealId?: string; action?: "approve" | "fund" | "release" | "dispute" }>({});
  const [selectedDealId, setSelectedDealId] = useState(defaultAppState.deals[0].id);
  const [selectedDisputeId, setSelectedDisputeId] = useState(defaultAppState.disputes[0].id);
  const [selectedEventId, setSelectedEventId] = useState(defaultAppState.auditEvents[0].id);
  const [selectedCounterparty, setSelectedCounterparty] = useState(defaultAppState.counterparties[0].company);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const selectedDeal = useMemo(
    () => data.deals.find((deal) => deal.id === selectedDealId) ?? data.deals[0],
    [data.deals, selectedDealId],
  );
  const selectedDispute = useMemo(
    () => data.disputes.find((dispute) => dispute.id === selectedDisputeId) ?? data.disputes[0],
    [data.disputes, selectedDisputeId],
  );
  const selectedEvent = useMemo(
    () => data.auditEvents.find((event) => event.id === selectedEventId) ?? data.auditEvents[0],
    [data.auditEvents, selectedEventId],
  );
  const selectedCounterpartyCard = useMemo(
    () => data.counterparties.find((entry) => entry.company === selectedCounterparty) ?? data.counterparties[0],
    [data.counterparties, selectedCounterparty],
  );

  async function refreshWalletState({ requestedAccount, respectManualDisconnect = true }: { requestedAccount?: string; respectManualDisconnect?: boolean } = {}) {
    if (respectManualDisconnect && walletManuallyDisconnected) {
      setWalletState({
        ...defaultWalletState,
        contractAddress: getEscrowContractAddress(),
        contractReady: isEscrowContractConfigured(),
      });
      return;
    }

    const provider = getInjectedProvider();

    if (!provider) {
      setWalletState({
        ...defaultWalletState,
        connectionLabel: "Install MetaMask",
      });
      return;
    }

    try {
      const chainHex = (await provider.request({ method: "eth_chainId" })) as string;
      const chainId = Number.parseInt(chainHex, 16);
      const availableAccounts = (requestedAccount
        ? [requestedAccount]
        : ((await provider.request({ method: "eth_accounts" })) as string[])) ?? [];
      const firstAccount = availableAccounts[0];

      if (!firstAccount) {
        setWalletState({
          ...defaultWalletState,
          chainId,
          chainName: resolveChainName(chainId),
          isCorrectNetwork: chainId === getConfiguredChainId(),
          contractAddress: getEscrowContractAddress(),
          contractReady: isEscrowContractConfigured(),
          connectionLabel: "Connect Wallet",
        });
        return;
      }

      const nextWalletState = await getWalletSnapshot(firstAccount as `0x${string}`, chainId);
      setWalletState(nextWalletState);
    } catch (error) {
      setWalletState({
        ...defaultWalletState,
        connectionLabel: "Connect Wallet",
      });
      console.error("Failed to refresh wallet state", error);
    }
  }

  function disconnectWallet() {
    setWalletManuallyDisconnected(true);
    setWalletState({
      ...defaultWalletState,
      contractAddress: getEscrowContractAddress(),
      contractReady: isEscrowContractConfigured(),
    });
    toast({
      type: "info",
      title: "Wallet hidden from this session",
      description: "Reconnect any time from the top bar or settings screen.",
    });
  }

  async function connectWallet() {
    const provider = getInjectedProvider();

    if (!provider) {
      toast({
        type: "warning",
        title: "Wallet extension not found",
        description: "Install MetaMask or another injected wallet to continue.",
      });
      return false;
    }

    setIsWalletBusy(true);

    try {
      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      setWalletManuallyDisconnected(false);
      await refreshWalletState({ requestedAccount: accounts[0], respectManualDisconnect: false });
      toast({
        type: "success",
        title: "Wallet connected",
        description: accounts[0] ? `${getShortAddress(accounts[0])} is ready for Arbitrum Sepolia.` : "Wallet connection established.",
      });
      return true;
    } catch (error) {
      toast({
        type: "error",
        title: "Could not connect wallet",
        description: formatWalletError(error),
      });
      return false;
    } finally {
      setIsWalletBusy(false);
    }
  }

  async function switchWalletNetwork() {
    const provider = getInjectedProvider();

    if (!provider) {
      toast({
        type: "warning",
        title: "Wallet extension not found",
        description: "Install MetaMask or another injected wallet first.",
      });
      return false;
    }

    setIsWalletBusy(true);

    try {
      await switchToConfiguredChain(provider);
      await refreshWalletState({ respectManualDisconnect: false });
      toast({
        type: "success",
        title: "Network switched",
        description: "Wallet is now on Arbitrum Sepolia.",
      });
      return true;
    } catch (error) {
      toast({
        type: "error",
        title: "Could not switch network",
        description: formatWalletError(error),
      });
      return false;
    } finally {
      setIsWalletBusy(false);
    }
  }

  async function ensureWalletReady({
    requireContract = false,
    allowDisconnectedFallback = false,
  }: {
    requireContract?: boolean;
    allowDisconnectedFallback?: boolean;
  } = {}) {
    const provider = getInjectedProvider();

    if (!provider) {
      toast({
        type: "warning",
        title: "Wallet extension not found",
        description: "Install MetaMask or another injected wallet to continue.",
      });
      return null;
    }

    if (!walletState.isConnected) {
      if (allowDisconnectedFallback) {
        return provider;
      }

      toast({
        type: "info",
        title: "Connect your wallet first",
        description: "TradeLock needs a connected Arbitrum Sepolia wallet for this action.",
      });
      setActiveScreen("settings");
      return null;
    }

    if (!walletState.isCorrectNetwork) {
      toast({
        type: "warning",
        title: "Wrong network selected",
        description: "Switch to Arbitrum Sepolia before continuing.",
      });
      return null;
    }

    if (requireContract && !walletState.contractReady) {
      toast({
        type: "warning",
        title: "Escrow contract not configured",
        description: "Fill NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS to enable on-chain actions.",
      });
      return null;
    }

    return provider;
  }

  async function syncAppState({ notifyOnError = true }: { notifyOnError?: boolean } = {}) {
    setIsSyncing(true);

    try {
      const response = await fetch("/api/app-state", { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`App state request failed with ${response.status}`);
      }

      const nextData = (await response.json()) as TradeLockAppState;
      setData(nextData);
    } catch (error) {
      if (notifyOnError) {
        toast({
          type: "warning",
          title: "Using default app state",
          description: error instanceof Error ? error.message : "Unable to load the current workspace state.",
        });
      }
    } finally {
      setIsSyncing(false);
    }
  }

  async function syncSystemStatus({ notifyOnError = false }: { notifyOnError?: boolean } = {}) {
    try {
      const response = await fetch("/api/system/status", { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`System status request failed with ${response.status}`);
      }

      const nextStatus = (await response.json()) as SystemStatus;
      setSystemStatus(nextStatus);
    } catch (error) {
      if (notifyOnError) {
        toast({
          type: "warning",
          title: "Could not check service status",
          description: error instanceof Error ? error.message : "Unknown system status error.",
        });
      }
    }
  }

  async function syncCustodySnapshot({ notifyOnError = false }: { notifyOnError?: boolean } = {}) {
    try {
      const response = await fetch("/api/system/custody", { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Custody status request failed with ${response.status}`);
      }

      const payload = (await response.json()) as { summary?: CustodySnapshot | null };
      setCustodySnapshot(payload.summary ?? null);
    } catch (error) {
      if (notifyOnError) {
        toast({
          type: "warning",
          title: "Could not load custody snapshot",
          description: error instanceof Error ? error.message : "Unknown custody status error.",
        });
      }
    }
  }

  async function createDemoDeal(): Promise<Deal | null> {
    const provider = await ensureWalletReady({ allowDisconnectedFallback: false });

    if (!provider) {
      return null;
    }

    setIsSyncing(true);

    try {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer: "GlobalImport Ltd.",
          buyerLocation: "Singapore",
          seller: "Shenzhen Parts Co.",
          sellerLocation: "China",
          amountRaw: "5,000.00",
          milestone: "Buyer confirmation pending",
          progress: "0/3",
          proofStatus: "Waiting Proof",
          status: "Active",
          network: "Arbitrum Sepolia",
          proofFile: "AwaitingUpload",
        }),
      });

      if (!response.ok) {
        throw new Error(`Deal creation failed with ${response.status}`);
      }

      const payload = (await response.json()) as { deal: Deal };
      const settlementTokenAddress = getSettlementTokenAddress();
      const sellerWallet = resolveCounterpartyWallet(payload.deal.seller, walletState.address);
      let onchainCreated = false;

      if (walletState.contractReady && settlementTokenAddress && sellerWallet) {
        try {
          const txHash = await writeEscrowContract({
            provider,
            functionName: "createDeal",
            args: [
              payload.deal.id,
              sellerWallet.address,
              settlementTokenAddress,
              formatSettlementAmount(payload.deal.amountRaw),
              createDealMetadataUri(payload.deal.id),
            ],
          });

          await fetch(`/api/deals/${payload.deal.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              txHash,
              status: "Active",
              proofStatus: "Waiting Proof",
              milestone: "On-chain escrow created - funding pending",
              progress: "0/3",
            }),
          });
          await fetch("/api/audit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dealId: payload.deal.id,
              type: "Deal Created Onchain",
              actor: walletState.address ?? payload.deal.buyer,
              asset: payload.deal.amount,
              status: "Confirmed",
              txHash,
            }),
          });

          onchainCreated = true;

          if (sellerWallet.source === "fallback") {
            toast({
              type: "warning",
              title: "Seller wallet used fallback address",
              description: "No mapped seller wallet was configured, so this demo used the connected wallet address.",
            });
          }
        } catch (contractError) {
          toast({
            type: "warning",
            title: "Deal created in app, on-chain step skipped",
            description: formatWalletError(contractError),
          });
        }
      } else if (walletState.contractReady && !settlementTokenAddress) {
        toast({
          type: "warning",
          title: "Settlement token missing",
          description: "Fill NEXT_PUBLIC_USDC_ADDRESS to create deals on-chain.",
        });
      } else if (walletState.contractReady && !sellerWallet) {
        toast({
          type: "warning",
          title: "Seller wallet not configured",
          description: "Add NEXT_PUBLIC_SELLER_*_ADDRESS values to create deals on-chain with the intended seller.",
        });
      } else if (!walletState.contractReady) {
        toast({
          type: "info",
          title: "Deal saved off-chain only",
          description: "Add NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS to turn this into an on-chain create transaction.",
        });
      }

      await syncAppState({ notifyOnError: false });
      await syncSystemStatus();
      await syncCustodySnapshot();

      setSelectedDealId(payload.deal.id);
      setActiveScreen("deals");
      toast({
        type: "success",
        title: onchainCreated ? "Deal created on-chain" : "Demo deal created",
        description: onchainCreated
          ? `${payload.deal.id} is now tracked on Arbitrum Sepolia and in the audit trail.`
          : `${payload.deal.id} is now available in the deals list and audit trail.`,
      });

      return payload.deal;
    } catch (error) {
      toast({
        type: "error",
        title: "Could not create deal",
        description: error instanceof Error ? error.message : "Unexpected error while creating a demo deal.",
      });
      return null;
    } finally {
      setIsSyncing(false);
    }
  }

  async function uploadProofForDeal({
    dealId,
    file,
    actor,
    asset,
  }: {
    dealId: string;
    file: File;
    actor?: string;
    asset?: string;
  }) {
    setIsUploadingProof(true);

    try {
      const formData = new FormData();
      formData.append("dealId", dealId);
      formData.append("file", file);
      if (actor) formData.append("actor", actor);
      if (asset) formData.append("asset", asset);

      const response = await fetch("/api/proofs/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `Proof upload failed with ${response.status}`);
      }

      const payload = (await response.json()) as {
        proof?: { proofHash?: string };
        deal?: Deal | null;
      };

      if (payload.proof?.proofHash && walletState.contractReady) {
        const provider = await ensureWalletReady({ requireContract: true, allowDisconnectedFallback: true });

        if (provider && walletState.isConnected && walletState.isCorrectNetwork && walletState.contractReady) {
          try {
            const txHash = await writeEscrowContract({
              provider,
              functionName: "submitProofHash",
              args: [dealId, payload.proof.proofHash],
            });

            await fetch(`/api/deals/${dealId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                txHash,
                proofStatus: "Proof Verified",
                milestone: "Proof hash anchored on-chain",
              }),
            });
            await fetch("/api/audit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                dealId,
                type: "Proof Anchored Onchain",
                actor: walletState.address ?? actor ?? "TradeLock Operator",
                asset: asset ?? payload.deal?.amount ?? "0.00 USDC",
                status: "Proof Verified",
                txHash,
                proofHash: payload.proof.proofHash,
                proofFile: file.name,
              }),
            });
          } catch (contractError) {
            toast({
              type: "warning",
              title: "Proof uploaded, on-chain anchor skipped",
              description: formatWalletError(contractError),
            });
          }
        }
      }

      await syncAppState({ notifyOnError: false });
      await syncSystemStatus();
      await syncCustodySnapshot();
      setSelectedDealId(dealId);
      setActiveScreen("audit");
      toast({
        type: "success",
        title: "Proof uploaded",
        description: `${file.name} was pinned to IPFS and added to the audit trail.`,
      });
      return true;
    } catch (error) {
      toast({
        type: "error",
        title: "Proof upload failed",
        description: error instanceof Error ? error.message : "Unexpected upload error.",
      });
      return false;
    } finally {
      setIsUploadingProof(false);
    }
  }

  async function releaseFundsForDeal(deal: Deal) {
    const provider = await ensureWalletReady({ requireContract: true });

    if (!provider) {
      return false;
    }

    setDealActionState({ dealId: deal.id, action: "release" });

    try {
      const txHash = await writeEscrowContract({
        provider,
        functionName: "releaseFunds",
        args: [deal.id],
      });

      await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Completed",
          proofStatus: "Proof Verified",
          milestone: "Funds released to seller",
          progress: "3/3",
          txHash,
        }),
      });
      await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: deal.id,
          type: "Funds Released",
          actor: walletState.address ?? "TradeLock Operator",
          asset: deal.amount,
          status: "Completed",
          txHash,
        }),
      });

      await syncAppState({ notifyOnError: false });
      await syncSystemStatus();
      await syncCustodySnapshot();
      setSelectedDealId(deal.id);
      toast({
        type: "success",
        title: "Funds released",
        description: `${deal.id} is now marked as completed on-chain and in TradeLock.`,
      });
      return true;
    } catch (error) {
      toast({
        type: "error",
        title: "Could not release funds",
        description: formatWalletError(error),
      });
      return false;
    } finally {
      setDealActionState({});
    }
  }

  async function approveSettlementForDeal(deal: Deal) {
    const provider = await ensureWalletReady({ requireContract: true });
    const spender = getEscrowContractAddress();

    if (!provider || !spender) {
      return false;
    }

    setDealActionState({ dealId: deal.id, action: "approve" });

    try {
      const txHash = await approveSettlementToken({
        provider,
        spender,
        amount: formatSettlementAmount(deal.amountRaw),
      });

      await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash,
          status: "Active",
          milestone: "Settlement token approved - ready to fund escrow",
          progress: "0/3",
        }),
      });
      await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: deal.id,
          type: "Token Approved",
          actor: walletState.address ?? "TradeLock Operator",
          asset: deal.amount,
          status: "Confirmed",
          txHash,
        }),
      });

      await syncAppState({ notifyOnError: false });
      await syncSystemStatus();
      await syncCustodySnapshot();
      setSelectedDealId(deal.id);
      toast({
        type: "success",
        title: "Settlement token approved",
        description: `${deal.id} is ready for escrow funding.`,
      });
      return true;
    } catch (error) {
      toast({
        type: "error",
        title: "Could not approve token",
        description: formatWalletError(error),
      });
      return false;
    } finally {
      setDealActionState({});
    }
  }

  async function fundEscrowForDeal(deal: Deal) {
    const provider = await ensureWalletReady({ requireContract: true });

    if (!provider) {
      return false;
    }

    setDealActionState({ dealId: deal.id, action: "fund" });

    try {
      const txHash = await writeEscrowContract({
        provider,
        functionName: "fundDeal",
        args: [deal.id],
      });

      await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Funded",
          proofStatus: "Waiting Proof",
          milestone: "Escrow funded on-chain - waiting seller proof",
          progress: "1/3",
          txHash,
        }),
      });
      await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: deal.id,
          type: "Escrow Funded",
          actor: walletState.address ?? "TradeLock Operator",
          asset: deal.amount,
          status: "Funded",
          txHash,
        }),
      });

      await syncAppState({ notifyOnError: false });
      await syncSystemStatus();
      await syncCustodySnapshot();
      setSelectedDealId(deal.id);
      toast({
        type: "success",
        title: "Escrow funded",
        description: `${deal.id} is now funded and waiting for proof submission.`,
      });
      return true;
    } catch (error) {
      toast({
        type: "error",
        title: "Could not fund escrow",
        description: formatWalletError(error),
      });
      return false;
    } finally {
      setDealActionState({});
    }
  }

  async function openDisputeForDeal(deal: Deal) {
    const provider = await ensureWalletReady({ requireContract: true });

    if (!provider) {
      return false;
    }

    setDealActionState({ dealId: deal.id, action: "dispute" });

    try {
      const txHash = await writeEscrowContract({
        provider,
        functionName: "openDispute",
        args: [deal.id, "Manual dispute opened from TradeLock dashboard"],
      });

      await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Disputed",
          milestone: "Dispute opened - escrow frozen pending review",
          txHash,
        }),
      });
      await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: deal.id,
          buyer: deal.buyer,
          seller: deal.seller,
          amount: deal.amount,
          reason: "Manual dispute opened from TradeLock dashboard",
          evidenceStatus: "Evidence Submitted",
          status: "Under Review",
          txHash,
        }),
      });
      await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: deal.id,
          type: "Dispute Opened",
          actor: walletState.address ?? "TradeLock Operator",
          asset: deal.amount,
          status: "Disputed",
          txHash,
        }),
      });

      await syncAppState({ notifyOnError: false });
      await syncSystemStatus();
      await syncCustodySnapshot();
      setActiveScreen("disputes");
      toast({
        type: "success",
        title: "Dispute opened",
        description: `${deal.id} is now frozen for review.`,
      });
      return true;
    } catch (error) {
      toast({
        type: "error",
        title: "Could not open dispute",
        description: formatWalletError(error),
      });
      return false;
    } finally {
      setDealActionState({});
    }
  }

  function isDealActionPending(dealId: string, action: "approve" | "fund" | "release" | "dispute") {
    return dealActionState.dealId === dealId && dealActionState.action === action;
  }

  useEffect(() => {
    const syncScreenFromUrl = () => {
      setActiveScreen(parseScreenFromUrl());
    };

    syncScreenFromUrl();
    window.addEventListener("popstate", syncScreenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncScreenFromUrl);
    };
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (activeScreen === "dashboard") {
      url.searchParams.delete("screen");
    } else {
      url.searchParams.set("screen", activeScreen);
    }

    window.history.replaceState({}, "", url);
  }, [activeScreen]);

  useEffect(() => {
    syncAppState({ notifyOnError: false });
    syncSystemStatus();
    syncCustodySnapshot();
  }, []);

  useEffect(() => {
    const provider = getInjectedProvider();

    void refreshWalletState();

    if (!provider?.on) {
      return;
    }

    const handleAccountsChanged = (accounts: unknown) => {
      const nextAccount = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : undefined;
      void refreshWalletState({ requestedAccount: nextAccount, respectManualDisconnect: false });
    };
    const handleChainChanged = () => {
      void refreshWalletState({ respectManualDisconnect: false });
    };

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [walletManuallyDisconnected]);

  useEffect(() => {
    if (!data.deals.some((deal) => deal.id === selectedDealId) && data.deals[0]) {
      setSelectedDealId(data.deals[0].id);
    }
  }, [data.deals, selectedDealId]);

  useEffect(() => {
    if (!data.disputes.some((dispute) => dispute.id === selectedDisputeId) && data.disputes[0]) {
      setSelectedDisputeId(data.disputes[0].id);
    }
  }, [data.disputes, selectedDisputeId]);

  useEffect(() => {
    if (!data.auditEvents.some((event) => event.id === selectedEventId) && data.auditEvents[0]) {
      setSelectedEventId(data.auditEvents[0].id);
    }
  }, [data.auditEvents, selectedEventId]);

  useEffect(() => {
    if (!data.counterparties.some((entry) => entry.company === selectedCounterparty) && data.counterparties[0]) {
      setSelectedCounterparty(data.counterparties[0].company);
    }
  }, [data.counterparties, selectedCounterparty]);

  return (
    <TradeLockDataProvider
      value={{
        data,
        isSyncing,
        isUploadingProof,
        isWalletBusy,
        systemStatus,
        custodySnapshot,
        walletState,
        createDemoDeal,
        uploadProofForDeal,
        connectWallet,
        disconnectWallet,
        switchWalletNetwork,
        approveSettlementForDeal,
        fundEscrowForDeal,
        releaseFundsForDeal,
        openDisputeForDeal,
        isDealActionPending,
      }}
    >
      <SplashScreen />
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigate={(screen) => setActiveScreen(screen)}
      />
      <main className="relative overflow-hidden bg-[#020b1a]">
      <div className="world-grid pointer-events-none absolute inset-0 opacity-40 xl:hidden" />
      <div className="pointer-events-none absolute left-0 top-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl xl:hidden" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl xl:hidden" />

      <div className="relative mx-auto min-h-screen w-full max-w-[1700px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:max-w-none xl:px-0 xl:py-0">
        <DesktopLayout
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
          walletState={walletState}
          isWalletBusy={isWalletBusy}
          tickerItems={custodySnapshot?.recentActivity}
          onConnectWallet={() => void connectWallet()}
          onDisconnectWallet={disconnectWallet}
          onSwitchWalletNetwork={() => void switchWalletNetwork()}
          onOpenSearch={() => setCommandOpen(true)}
        >
          {activeScreen === "dashboard" && <DashboardDesktopScreen selectedDeal={selectedDeal} onSelectDeal={setSelectedDealId} />}
          {activeScreen === "deals" && <DealsDesktopScreen selectedDeal={selectedDeal} onSelectDeal={setSelectedDealId} />}
          {activeScreen === "create" && <CreateDesktopScreen onCreated={setSelectedDealId} />}
          {activeScreen === "disputes" && <DisputesDesktopScreen selectedDispute={selectedDispute} onSelectDispute={setSelectedDisputeId} />}
          {activeScreen === "audit" && <AuditDesktopScreen selectedEvent={selectedEvent} onSelectEvent={setSelectedEventId} />}
          {activeScreen === "counterparties" && (
            <CounterpartiesDesktopScreen
              selectedCounterparty={selectedCounterpartyCard}
              onSelectCounterparty={setSelectedCounterparty}
            />
          )}
          {activeScreen === "settings" && <SettingsDesktopScreen />}
        </DesktopLayout>

        <MobileLayout
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
          navOpen={mobileNavOpen}
          setNavOpen={setMobileNavOpen}
          walletState={walletState}
          isWalletBusy={isWalletBusy}
          tickerItems={custodySnapshot?.recentActivity}
          onConnectWallet={() => void connectWallet()}
          onDisconnectWallet={disconnectWallet}
          onSwitchWalletNetwork={() => void switchWalletNetwork()}
        >
          {activeScreen === "dashboard" && <DashboardMobileScreen selectedDeal={selectedDeal} />}
          {activeScreen === "deals" && <DealsMobileScreen selectedDeal={selectedDeal} onSelectDeal={setSelectedDealId} />}
          {activeScreen === "create" && <CreateMobileScreen onCreated={setSelectedDealId} />}
          {activeScreen === "disputes" && <DisputesMobileScreen selectedDispute={selectedDispute} onSelectDispute={setSelectedDisputeId} />}
          {activeScreen === "audit" && <AuditMobileScreen selectedEvent={selectedEvent} onSelectEvent={setSelectedEventId} />}
          {activeScreen === "counterparties" && (
            <CounterpartiesMobileScreen
              selectedCounterparty={selectedCounterpartyCard}
              onSelectCounterparty={setSelectedCounterparty}
            />
          )}
          {activeScreen === "settings" && <SettingsMobileScreen />}
        </MobileLayout>
      </div>
      </main>
    </TradeLockDataProvider>
  );
}
