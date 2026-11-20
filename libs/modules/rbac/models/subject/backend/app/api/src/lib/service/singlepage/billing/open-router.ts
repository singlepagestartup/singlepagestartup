import type { IOpenRouterBilling } from "@sps/shared-third-parties";

export type TOpenRouterBillingPurpose =
  | "context_summary"
  | "classification"
  | "classification_repair"
  | "knowledge_rerank"
  | "tool_selection"
  | "model_selection"
  | "model_selection_repair"
  | "generation"
  | "tool_iteration";

export interface IOpenRouterBillingLedgerEntry {
  purpose: TOpenRouterBillingPurpose;
  modelId: string;
  status: "success" | "error";
  billing: IOpenRouterBilling | null;
  fallbackReason?: string;
  error?: string;
}
