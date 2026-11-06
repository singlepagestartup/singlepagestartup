export const RBAC_AI_THREAD_CONTEXT_KEY = "rbacAiThreadContext";

export interface IRbacAiWorkingDraft {
  id: string;
  title: string;
  text: string;
  hash: string;
  fileIds: string[];
  triggerMessageId: string;
}

export interface IRbacAiProfileContext {
  revision: number;
  resetMessageId: string | null;
  summary: string;
  throughMessageId: string | null;
  prefixHash: string | null;
  sourceRefs: Array<{ id: string; contentHash: string }>;
  workingDraft: IRbacAiWorkingDraft | null;
}

export interface IRbacAiThreadContext {
  version: 1;
  profiles: Record<string, IRbacAiProfileContext>;
}

export interface IRbacAiContextMetrics {
  version: 1;
  mode: "full" | "compact";
  historyMessages: number;
  retainedMessages: number;
  summarizedMessages: number;
  historyEstimatedTokens: number;
  inputEstimatedTokens: number;
  knowledgeEstimatedTokens: number;
  toolsEstimatedTokens: number;
  summaryEstimatedTokens: number;
  originalMediaParts: number;
  summaryCalls: number;
  budgetExceeded: boolean;
  budgetExceededReason: string | null;
  fallbackReason: string | null;
  durationMs: number;
}

export function parseRbacAiThreadContext(
  metadata: unknown,
): IRbacAiThreadContext | null {
  const root = (metadata as Record<string, unknown> | null)?.[
    RBAC_AI_THREAD_CONTEXT_KEY
  ] as IRbacAiThreadContext | undefined;
  if (
    !root ||
    root.version !== 1 ||
    !root.profiles ||
    Array.isArray(root.profiles) ||
    typeof root.profiles !== "object"
  )
    return null;
  for (const value of Object.values(root.profiles)) {
    if (
      !value ||
      !Number.isInteger(value.revision) ||
      value.revision < 0 ||
      !(
        value.resetMessageId === null ||
        typeof value.resetMessageId === "string"
      ) ||
      typeof value.summary !== "string" ||
      value.summary.length > 100_000 ||
      !(
        value.throughMessageId === null ||
        typeof value.throughMessageId === "string"
      ) ||
      !(value.prefixHash === null || typeof value.prefixHash === "string") ||
      !Array.isArray(value.sourceRefs) ||
      !value.sourceRefs.every(
        (ref) =>
          Boolean(ref) &&
          typeof ref.id === "string" &&
          typeof ref.contentHash === "string",
      )
    )
      return null;
    const draft = value.workingDraft;
    if (
      draft !== null &&
      (!draft ||
        typeof draft.id !== "string" ||
        typeof draft.title !== "string" ||
        typeof draft.text !== "string" ||
        typeof draft.hash !== "string" ||
        typeof draft.triggerMessageId !== "string" ||
        !Array.isArray(draft.fileIds) ||
        !draft.fileIds.every((id) => typeof id === "string"))
    )
      return null;
  }
  return root;
}
