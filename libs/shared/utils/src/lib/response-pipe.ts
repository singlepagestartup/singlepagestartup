import { ContentfulStatusCode } from "hono/utils/http-status";

const browserGlobals = globalThis as typeof globalThis & {
  window?: unknown;
  document?: { cookie: string };
  localStorage?: {
    getItem: (key: string) => string | null;
    removeItem: (key: string) => void;
  };
};
const isServer = typeof browserGlobals.window === "undefined";
const isDebug =
  process.env.NODE_ENV === "development" || process.env.DEBUG === "true";
const sessionExpiredMessage = "Session expired. Please sign in again.";
const authenticationStorageEvent = "sps-rbac-auth-storage-change";
const invalidCredentialsPattern = /invalid credentials/i;
const sessionStatePattern =
  /unauthorized|token required|no session|authorization error|no subject provided in the token|invalid token issued/i;

function dispatchBrowserAuthorizationStateChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(authenticationStorageEvent));
}

function hasBrowserAuthorizationState() {
  if (!browserGlobals.document) {
    return false;
  }

  const hasJwtCookie = browserGlobals.document.cookie
    .split("; ")
    .some((cookie) => cookie.startsWith("rbac.subject.jwt="));

  let hasRefreshToken = false;

  try {
    hasRefreshToken = Boolean(
      browserGlobals.localStorage?.getItem("rbac.subject.refresh"),
    );
  } catch {
    hasRefreshToken = false;
  }

  return hasJwtCookie || hasRefreshToken;
}

function clearBrowserAuthorizationState() {
  if (browserGlobals.document) {
    browserGlobals.document.cookie = "rbac.subject.jwt=; Max-Age=0; path=/";
  }

  try {
    browserGlobals.localStorage?.removeItem("rbac.subject.refresh");
  } catch {
    // Ignore storage access issues in restricted environments.
  }

  dispatchBrowserAuthorizationStateChange();
}

function shouldTreatAsExpiredSession(props: {
  status: number;
  message: string;
}) {
  if (props.status !== 401) {
    return false;
  }

  if (invalidCredentialsPattern.test(props.message)) {
    return false;
  }

  return (
    hasBrowserAuthorizationState() || sessionStatePattern.test(props.message)
  );
}

async function util<T>(props: {
  res: Response;
  catchErrors?: boolean;
}): Promise<T | undefined> {
  if (!props.res.ok) {
    let errorJson;
    let errorMessages: string[] = [];
    let causes: { message: string; stack?: string }[] = [];

    try {
      // Clone response before reading to avoid "body already used" error
      const clonedRes = props.res.clone();
      errorJson = await clonedRes.json();
    } catch {
      // Not JSON
    }

    const primaryMessage =
      errorJson?.error ||
      errorJson?.message ||
      errorJson?.data ||
      (Array.isArray(errorJson?.cause)
        ? errorJson.cause[0]?.message
        : errorJson?.cause);

    if (primaryMessage) {
      errorMessages.push(primaryMessage);
    }

    if (errorJson?.cause) {
      if (Array.isArray(errorJson.cause)) {
        causes = errorJson.cause.map((e) => ({
          message: e.message,
          stack: isDebug ? e.stack?.replace(/\n/g, "\\n") : undefined,
        }));
      } else {
        causes.push({
          message: errorJson.cause,
          stack: isDebug ? errorJson?.stack?.replace(/\n/g, "\\n") : undefined,
        });
      }
    }

    if (!primaryMessage) {
      const currentErrorMessage = `${props.res.status} | ${props.res.statusText}`;
      causes.push({
        message: currentErrorMessage,
        stack: isDebug ? new Error().stack?.replace(/\n/g, "\\n") : undefined,
      });
      errorMessages.push(currentErrorMessage);
    }

    const errorPayload = {
      message: errorMessages[0] || "Unknown error",
      status: props.res.status,
      cause: causes,
    };

    if (props.catchErrors) {
      console.error("❌ API Error:", JSON.stringify(errorPayload, null, 2));
      return undefined;
    }

    if (isServer) {
      // Dynamic import to avoid bundling Hono on client
      const { HTTPException } = await import("hono/http-exception");

      throw new HTTPException(props.res.status as ContentfulStatusCode, {
        message: JSON.stringify(errorPayload),
        cause: errorPayload,
      });
    } else {
      const shouldClearAuthorizationState = shouldTreatAsExpiredSession({
        status: errorPayload.status,
        message: errorPayload.message,
      });

      if (shouldClearAuthorizationState) {
        clearBrowserAuthorizationState();
      }

      const clientError = new Error(
        shouldClearAuthorizationState
          ? sessionExpiredMessage
          : errorPayload.message || "Unknown error",
      ) as Error & {
        status?: number;
        payload?: typeof errorPayload;
        rawMessage?: string;
      };

      clientError.name = "ClientResponseError";
      clientError.status = errorPayload.status;
      clientError.payload = errorPayload;
      clientError.rawMessage = JSON.stringify(errorPayload);

      throw clientError;
    }
  }

  try {
    return (await props.res.json()) as T;
  } catch (error) {
    // Handle JSON parse errors or empty responses
    console.error("Failed to parse response JSON:", error);
    if (props.catchErrors) {
      return undefined;
    }
    throw error;
  }
}

export { util };
