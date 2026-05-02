import { settingsCards } from "@/lib/mock-data";
import type { AuditEvent, Counterparty, Deal, Dispute, SettingsState, SummaryItem } from "@/lib/types";

export type PersistedState = {
  deals: Deal[];
  disputes: Dispute[];
  auditEvents: AuditEvent[];
  counterparties: Counterparty[];
  settings: SettingsState;
};

function createWorkspaceSummary(): SummaryItem[] {
  return [
    { label: "Verified Business", value: "Verified" },
    { label: "Managed User Wallets", value: "0" },
    { label: "Custodial Pool", value: "Not initialized" },
    { label: "Default Network", value: "Arbitrum Sepolia" },
    { label: "Daily User Start", value: "Not scheduled" },
    { label: "Activity Cadence", value: "300s" },
    { label: "Pool ETH Reserve", value: "2 ETH" },
  ];
}

function createSecuritySummary(): SummaryItem[] {
  return [
    { label: "Custody Model", value: "Server-managed" },
    { label: "Pool Signer", value: "Not initialized" },
    { label: "Wallet Encryption", value: "Pending" },
    { label: "Automation Auth", value: "Pending" },
  ];
}

export function createDefaultSettingsState(): SettingsState {
  return {
    cards: settingsCards,
    workspaceSummary: createWorkspaceSummary(),
    securitySummary: createSecuritySummary(),
  };
}

export function createDefaultState(): PersistedState {
  return {
    deals: [],
    disputes: [],
    auditEvents: [],
    counterparties: [],
    settings: createDefaultSettingsState(),
  };
}
