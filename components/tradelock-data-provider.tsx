"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { CustodySnapshot, Deal, SystemStatus, TradeLockAppState, WalletState } from "@/lib/types";

type TradeLockDataContextValue = {
  data: TradeLockAppState;
  isSyncing: boolean;
  isUploadingProof: boolean;
  isWalletBusy: boolean;
  systemStatus: SystemStatus;
  custodySnapshot: CustodySnapshot | null;
  walletState: WalletState;
  createDemoDeal: () => Promise<Deal | null>;
  uploadProofForDeal: (input: {
    dealId: string;
    file: File;
    actor?: string;
    asset?: string;
  }) => Promise<boolean>;
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => void;
  switchWalletNetwork: () => Promise<boolean>;
  approveSettlementForDeal: (deal: Deal) => Promise<boolean>;
  fundEscrowForDeal: (deal: Deal) => Promise<boolean>;
  releaseFundsForDeal: (deal: Deal) => Promise<boolean>;
  openDisputeForDeal: (deal: Deal) => Promise<boolean>;
  isDealActionPending: (dealId: string, action: "approve" | "fund" | "release" | "dispute") => boolean;
};

const TradeLockDataContext = createContext<TradeLockDataContextValue | null>(null);

export function TradeLockDataProvider({
  value,
  children,
}: {
  value: TradeLockDataContextValue;
  children: ReactNode;
}) {
  return <TradeLockDataContext.Provider value={value}>{children}</TradeLockDataContext.Provider>;
}

export function useTradeLockData() {
  const context = useContext(TradeLockDataContext);

  if (!context) {
    throw new Error("useTradeLockData must be used within TradeLockDataProvider");
  }

  return context;
}
