export type AnalyticsMetadataValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type AnalyticsMetadata = Record<string, AnalyticsMetadataValue>;

export interface TrackAnalyticsEventInput {
  name: string;
  metadata?: AnalyticsMetadata;
}

type SanitizedAnalyticsMetadata = Record<
  string,
  Exclude<AnalyticsMetadataValue, undefined>
>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (
      command: "event",
      eventName: string,
      metadata?: SanitizedAnalyticsMetadata,
    ) => void;
    ym?: (
      counterId: number,
      method: "reachGoal",
      target: string,
      metadata?: SanitizedAnalyticsMetadata,
    ) => void;
  }
}

function sanitizeMetadata(
  metadata: AnalyticsMetadata | undefined,
): SanitizedAnalyticsMetadata {
  if (!metadata) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined),
  ) as SanitizedAnalyticsMetadata;
}

function trackYandexMetrika(
  input: TrackAnalyticsEventInput,
  metadata: SanitizedAnalyticsMetadata,
) {
  const counterId = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;

  if (!counterId || typeof window.ym !== "function") {
    return;
  }

  const parsedCounterId = Number(counterId);

  if (!Number.isFinite(parsedCounterId)) {
    return;
  }

  window.ym(parsedCounterId, "reachGoal", input.name, metadata);
}

function trackGoogle(
  input: TrackAnalyticsEventInput,
  metadata: SanitizedAnalyticsMetadata,
) {
  if (typeof window.dataLayer?.push === "function") {
    window.dataLayer.push({
      ...metadata,
      event: input.name,
    });

    return;
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", input.name, metadata);
  }
}

export function trackAnalyticsEvent(input: TrackAnalyticsEventInput) {
  if (typeof window === "undefined") {
    return;
  }

  const metadata = sanitizeMetadata(input.metadata);

  try {
    trackYandexMetrika(input, metadata);
  } catch {
    // Analytics should never break user-facing interactions.
  }

  try {
    trackGoogle(input, metadata);
  } catch {
    // Analytics should never break user-facing interactions.
  }
}
