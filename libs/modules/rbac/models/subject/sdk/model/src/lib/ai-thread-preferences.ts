export const RBAC_AI_THREAD_PREFERENCES_METADATA_KEY =
  "rbacAiThreadPreferences" as const;
export const RBAC_AI_THREAD_PREFERENCES_VERSION = 1 as const;

export interface IRbacAiThreadPreferences {
  version: typeof RBAC_AI_THREAD_PREFERENCES_VERSION;
  modelId: string;
}

function normalizeModelId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!normalized || normalized.length > 200) {
    return null;
  }

  return normalized;
}

export function parseRbacAiThreadPreferences(
  metadata: unknown,
): IRbacAiThreadPreferences | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const candidate = (metadata as Record<string, unknown>)[
    RBAC_AI_THREAD_PREFERENCES_METADATA_KEY
  ];

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }

  const candidateRecord = candidate as Record<string, unknown>;
  const modelId = normalizeModelId(candidateRecord.modelId);

  if (
    candidateRecord.version !== RBAC_AI_THREAD_PREFERENCES_VERSION ||
    !modelId
  ) {
    return null;
  }

  return {
    version: RBAC_AI_THREAD_PREFERENCES_VERSION,
    modelId,
  };
}

export function setRbacAiThreadModelPreference(props: {
  metadata: unknown;
  modelId: unknown;
}): Record<string, unknown> {
  const modelId = normalizeModelId(props.modelId);

  if (!modelId) {
    throw new Error("Validation error. Invalid OpenRouter thread model id");
  }

  const metadata =
    props.metadata &&
    typeof props.metadata === "object" &&
    !Array.isArray(props.metadata)
      ? { ...(props.metadata as Record<string, unknown>) }
      : {};

  metadata[RBAC_AI_THREAD_PREFERENCES_METADATA_KEY] = {
    version: RBAC_AI_THREAD_PREFERENCES_VERSION,
    modelId,
  } satisfies IRbacAiThreadPreferences;

  return metadata;
}
