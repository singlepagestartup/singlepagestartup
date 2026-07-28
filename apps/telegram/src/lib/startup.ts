const DEFAULT_INITIAL_RETRY_DELAY_MS = 5_000;
const DEFAULT_MAXIMUM_RETRY_DELAY_MS = 60_000;

export interface ITelegramStartupErrorSummary {
  code?: string;
  message: string;
  name: string;
}

export interface ITelegramStartupFailure {
  attempt: number;
  error: ITelegramStartupErrorSummary;
  retryDelayMs: number;
}

export interface IRunTelegramStartupWithRetryProps {
  initialRetryDelayMs?: number;
  maximumRetryDelayMs?: number;
  onFailure?: (failure: ITelegramStartupFailure) => void;
  onSuccess?: () => void;
  sleep?: (delayMs: number) => Promise<void>;
  synchronize: () => Promise<unknown>;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value) => typeof value === "string") as
    | string
    | undefined;
}

function redactTelegramCredentials(value: string): string {
  return value
    .replace(/\/bot[^/\s]+/gi, "/bot[redacted]")
    .replace(/\b\d{5,}:[A-Za-z0-9_-]{20,}\b/g, "[redacted]");
}

export function summarizeTelegramStartupError(
  error: unknown,
): ITelegramStartupErrorSummary {
  const errorRecord = asRecord(error);
  const nestedErrorRecord = asRecord(errorRecord?.["error"]);
  const causeRecord = asRecord(errorRecord?.["cause"]);
  const name = firstString(errorRecord?.["name"], "Error") ?? "Error";
  const message =
    firstString(errorRecord?.["message"], "Unknown Telegram startup error") ??
    "Unknown Telegram startup error";
  const code = firstString(
    nestedErrorRecord?.["code"],
    causeRecord?.["code"],
    errorRecord?.["code"],
  );

  return {
    name: redactTelegramCredentials(name),
    message: redactTelegramCredentials(message),
    ...(code ? { code: redactTelegramCredentials(code) } : {}),
  };
}

export async function runTelegramStartupWithRetry(
  props: IRunTelegramStartupWithRetryProps,
): Promise<void> {
  const initialRetryDelayMs = Math.max(
    1,
    props.initialRetryDelayMs ?? DEFAULT_INITIAL_RETRY_DELAY_MS,
  );
  const maximumRetryDelayMs = Math.max(
    initialRetryDelayMs,
    props.maximumRetryDelayMs ?? DEFAULT_MAXIMUM_RETRY_DELAY_MS,
  );
  const sleep =
    props.sleep ??
    ((delayMs: number) =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, delayMs);
      }));
  let attempt = 0;

  while (true) {
    try {
      await props.synchronize();
      props.onSuccess?.();
      return;
    } catch (error) {
      attempt += 1;
      const retryDelayMs = Math.min(
        initialRetryDelayMs * 2 ** Math.min(attempt - 1, 10),
        maximumRetryDelayMs,
      );

      props.onFailure?.({
        attempt,
        error: summarizeTelegramStartupError(error),
        retryDelayMs,
      });
      await sleep(retryDelayMs);
    }
  }
}
