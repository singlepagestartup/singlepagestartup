export const SOCIAL_MESSAGE_SYSTEM_METADATA_KEY = "systemMessage" as const;
export const SOCIAL_MESSAGE_SYSTEM_METADATA_VERSION = 1 as const;

export interface ISocialMessageSystemMetadata {
  version: typeof SOCIAL_MESSAGE_SYSTEM_METADATA_VERSION;
  source: string;
  excludeFromOpenRouter: true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function withSocialMessageSystemMetadata(props: {
  metadata?: unknown;
  source: string;
}): Record<string, unknown> {
  const metadata = isRecord(props.metadata) ? props.metadata : {};
  const currentValue = metadata[SOCIAL_MESSAGE_SYSTEM_METADATA_KEY];
  const currentSystemMetadata = isRecord(currentValue) ? currentValue : {};

  return {
    ...metadata,
    [SOCIAL_MESSAGE_SYSTEM_METADATA_KEY]: {
      ...currentSystemMetadata,
      version: SOCIAL_MESSAGE_SYSTEM_METADATA_VERSION,
      source: props.source,
      excludeFromOpenRouter: true,
    } satisfies ISocialMessageSystemMetadata,
  };
}

export function isSocialMessageExcludedFromOpenRouter(metadata: unknown) {
  if (!isRecord(metadata)) {
    return false;
  }

  const systemMetadata = metadata[SOCIAL_MESSAGE_SYSTEM_METADATA_KEY];

  return (
    isRecord(systemMetadata) && systemMetadata["excludeFromOpenRouter"] === true
  );
}
