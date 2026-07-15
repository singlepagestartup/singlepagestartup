export const RBAC_AI_REACTION_REQUEST_METADATA_KEY =
  "rbacAiReactionRequest" as const;
export const RBAC_AI_REACTION_REQUEST_VERSION = 1 as const;
export const RBAC_AI_REACTION_REQUEST_MAX_SKILL_IDS = 50;

export const rbacAiReactionReasoningValues = [
  "auto",
  "none",
  "low",
  "medium",
  "high",
  "xhigh",
] as const;

export type TRbacAiReactionReasoning =
  (typeof rbacAiReactionReasoningValues)[number];

export interface IRbacAiReactionRequest {
  version: typeof RBAC_AI_REACTION_REQUEST_VERSION;
  modelId: string;
  reasoning: TRbacAiReactionReasoning;
  skillIds: string[];
  useKnowledgeSearch: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireBoundedString(value: unknown, field: string, maxLength = 256) {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized || normalized.length > maxLength) {
    throw new Error(
      `Validation error. ${RBAC_AI_REACTION_REQUEST_METADATA_KEY}.${field} must be a non-empty string up to ${maxLength} characters.`,
    );
  }

  return normalized;
}

/**
 * Reads the RBAC-owned AI reaction request from generic social-message
 * metadata. Absence is a supported legacy/automatic mode; a present but
 * malformed envelope fails closed so backend execution never guesses the
 * requested model, reasoning, Skill, or Knowledge settings. Reply profiles are
 * selected from the chat participants by Agent and are intentionally not part
 * of this message-level contract.
 */
export function parseRbacAiReactionRequestMetadata(
  metadata: unknown,
): IRbacAiReactionRequest | null {
  if (!isRecord(metadata)) {
    return null;
  }

  if (!(RBAC_AI_REACTION_REQUEST_METADATA_KEY in metadata)) {
    return null;
  }

  const value = metadata[RBAC_AI_REACTION_REQUEST_METADATA_KEY];

  if (!isRecord(value)) {
    throw new Error(
      `Validation error. ${RBAC_AI_REACTION_REQUEST_METADATA_KEY} must be an object.`,
    );
  }

  if (value.version !== RBAC_AI_REACTION_REQUEST_VERSION) {
    throw new Error(
      `Validation error. Unsupported ${RBAC_AI_REACTION_REQUEST_METADATA_KEY}.version.`,
    );
  }

  const modelId = requireBoundedString(value.modelId, "modelId");

  if (
    typeof value.reasoning !== "string" ||
    !rbacAiReactionReasoningValues.some((reasoning) => {
      return reasoning === value.reasoning;
    })
  ) {
    throw new Error(
      `Validation error. Unsupported ${RBAC_AI_REACTION_REQUEST_METADATA_KEY}.reasoning.`,
    );
  }

  if (!Array.isArray(value.skillIds)) {
    throw new Error(
      `Validation error. ${RBAC_AI_REACTION_REQUEST_METADATA_KEY}.skillIds must be an array.`,
    );
  }

  const skillIds = Array.from(
    new Set(
      value.skillIds.map((skillId) => {
        return requireBoundedString(skillId, "skillIds[]");
      }),
    ),
  );

  if (skillIds.length > RBAC_AI_REACTION_REQUEST_MAX_SKILL_IDS) {
    throw new Error(
      `Validation error. ${RBAC_AI_REACTION_REQUEST_METADATA_KEY}.skillIds supports at most ${RBAC_AI_REACTION_REQUEST_MAX_SKILL_IDS} unique ids.`,
    );
  }

  if (typeof value.useKnowledgeSearch !== "boolean") {
    throw new Error(
      `Validation error. ${RBAC_AI_REACTION_REQUEST_METADATA_KEY}.useKnowledgeSearch must be a boolean.`,
    );
  }

  return {
    version: RBAC_AI_REACTION_REQUEST_VERSION,
    modelId,
    reasoning: value.reasoning as TRbacAiReactionReasoning,
    skillIds,
    useKnowledgeSearch: value.useKnowledgeSearch,
  };
}

export function normalizeRbacAiReactionRequestMetadata(
  metadata: unknown,
): Record<string, unknown> | undefined {
  if (!isRecord(metadata)) {
    return undefined;
  }

  const request = parseRbacAiReactionRequestMetadata(metadata);

  if (!request) {
    return metadata;
  }

  return {
    ...metadata,
    [RBAC_AI_REACTION_REQUEST_METADATA_KEY]: request,
  };
}
