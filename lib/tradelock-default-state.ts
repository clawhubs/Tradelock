import {
  auditEvents as initialAuditEvents,
  counterparties as initialCounterparties,
  settingsCards,
  deals as initialDeals,
  disputes as initialDisputes,
} from "@/lib/mock-data";
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
    { label: "Active Team Members", value: "12" },
    { label: "2FA Enabled", value: "Yes" },
    { label: "API Connected", value: "Yes" },
    { label: "Default Network", value: "Arbitrum Sepolia" },
    { label: "Notification Mode", value: "Daily Digest" },
    { label: "Workspace ID", value: "TLK-GIL-882312" },
  ];
}

function createSecuritySummary(): SummaryItem[] {
  return [
    { label: "Access Reviews", value: "Current" },
    { label: "Login Alerts", value: "Enabled" },
    { label: "Webhook Health", value: "Healthy" },
    { label: "Arbitration Policy", value: "Default" },
  ];
}

export function createDefaultState(): PersistedState {
  return {
    deals: initialDeals,
    disputes: initialDisputes,
    auditEvents: initialAuditEvents,
    counterparties: initialCounterparties,
    settings: {
      cards: settingsCards,
      workspaceSummary: createWorkspaceSummary(),
      securitySummary: createSecuritySummary(),
    },
  };
}
