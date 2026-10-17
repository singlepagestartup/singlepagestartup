export const RBAC_AI_DOCUMENT_PROPOSAL_KEY = "rbacAiDocumentProposal";

export interface IAIChatDocumentProposal {
  version: 1;
  id: string;
  status: "pending" | "needs_revision" | "applied" | "rejected";
  sourceId: string | null;
  expectedContentHash: string | null;
  title: string;
  userContext: string;
  fileIds: string[];
  triggerMessageId: string;
  shownInMessageId?: string;
  confirmationMessageId?: string;
  indexError?: string;
  processingError?: string;
}

export function getAIChatDocumentProposal(
  metadata: unknown,
): IAIChatDocumentProposal | null {
  if (!metadata || typeof metadata !== "object") return null;
  const value = (metadata as Record<string, unknown>)[
    RBAC_AI_DOCUMENT_PROPOSAL_KEY
  ] as IAIChatDocumentProposal | undefined;
  if (
    !value ||
    value.version !== 1 ||
    !["pending", "needs_revision", "applied", "rejected"].includes(
      value.status,
    ) ||
    typeof value.id !== "string" ||
    typeof value.title !== "string" ||
    typeof value.userContext !== "string" ||
    typeof value.triggerMessageId !== "string" ||
    !(value.sourceId === null || typeof value.sourceId === "string") ||
    !(
      value.expectedContentHash === null ||
      typeof value.expectedContentHash === "string"
    ) ||
    !Array.isArray(value.fileIds) ||
    !value.fileIds.every((id) => typeof id === "string") ||
    (value.shownInMessageId !== undefined &&
      typeof value.shownInMessageId !== "string") ||
    (value.confirmationMessageId !== undefined &&
      typeof value.confirmationMessageId !== "string")
  )
    return null;
  return value;
}
