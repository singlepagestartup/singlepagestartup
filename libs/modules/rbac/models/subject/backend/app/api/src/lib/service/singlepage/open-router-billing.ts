import type { IOpenRouterBilling } from "@sps/shared-third-parties";

export const OPEN_ROUTER_BILLING_ROUTE_SUFFIX = "/react-by/openrouter";
export const OPEN_ROUTER_INTERNAL_TOKEN_USD = 0.001;
export const OPEN_ROUTER_PRECHARGE_TOKENS = 1;

export type TOpenRouterBillingPurpose =
  | "classification"
  | "classification_repair"
  | "model_selection"
  | "model_selection_repair"
  | "generation";

export interface IOpenRouterBillingLedgerEntry {
  purpose: TOpenRouterBillingPurpose;
  modelId: string;
  status: "success" | "error";
  billing: IOpenRouterBilling | null;
  fallbackReason?: string;
  error?: string;
}

export interface IOpenRouterBillingSummary {
  prechargeTokens: number;
  exactTokens: number;
  deltaTokens: number;
  totalUsd: number;
  selectedModelId: string | null;
  calls: Array<{
    purpose: TOpenRouterBillingPurpose;
    modelId: string;
    responseModelId: string | null;
    status: "success" | "error";
    totalUsd: number;
    usage: IOpenRouterBilling["usage"];
    pricing: IOpenRouterBilling["pricing"];
    usageCostCredits: number | null;
    upstreamInferenceCostCredits: number | null;
    breakdown: IOpenRouterBilling["breakdown"] | null;
    fallbackReason?: string;
    error?: string;
  }>;
}

export function isOpenRouterBillingRoute(route: string): boolean {
  return route.toLowerCase().endsWith(OPEN_ROUTER_BILLING_ROUTE_SUFFIX);
}

export function calculateOpenRouterExactTokens(totalUsd: number): number {
  const normalizedTotalUsd = Number.isFinite(totalUsd)
    ? Math.max(totalUsd, 0)
    : 0;

  if (normalizedTotalUsd === 0) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil(
      (normalizedTotalUsd - Number.EPSILON) / OPEN_ROUTER_INTERNAL_TOKEN_USD,
    ),
  );
}

export function calculateSettlementDeltaTokens(props: {
  prechargeTokens: number;
  exactTokens: number;
}): number {
  return props.exactTokens - props.prechargeTokens;
}

export function summarizeOpenRouterBilling(props: {
  calls: IOpenRouterBillingLedgerEntry[];
  selectedModelId: string | null;
  prechargeTokens?: number;
}): IOpenRouterBillingSummary {
  const prechargeTokens = props.prechargeTokens ?? OPEN_ROUTER_PRECHARGE_TOKENS;
  const totalUsd = props.calls.reduce((sum, call) => {
    return sum + (call.billing?.totalUsd || 0);
  }, 0);
  const exactTokens = calculateOpenRouterExactTokens(totalUsd);

  return {
    prechargeTokens,
    exactTokens,
    deltaTokens: calculateSettlementDeltaTokens({
      prechargeTokens,
      exactTokens,
    }),
    totalUsd,
    selectedModelId: props.selectedModelId,
    calls: props.calls.map((call) => {
      return {
        purpose: call.purpose,
        modelId: call.modelId,
        responseModelId: call.billing?.responseModelId || null,
        status: call.status,
        totalUsd: call.billing?.totalUsd || 0,
        usage: call.billing?.usage || null,
        pricing: call.billing?.pricing || null,
        usageCostCredits: call.billing?.usageCostCredits || null,
        upstreamInferenceCostCredits:
          call.billing?.upstreamInferenceCostCredits || null,
        breakdown: call.billing?.breakdown || null,
        ...(call.fallbackReason ? { fallbackReason: call.fallbackReason } : {}),
        ...(call.error ? { error: call.error } : {}),
      };
    }),
  };
}
