import { AsyncLocalStorage } from "node:async_hooks";
import { API_SERVICE_URL } from "@sps/shared-utils";

export type IMcpRequestAuthContext = {
  authorization?: string;
  rbacSecretKey?: string;
  clientId?: string;
  scopes?: string[];
  expiresAt?: number;
};

const authStorage = new AsyncLocalStorage<IMcpRequestAuthContext>();

let fetchForwardingInstalled = false;

/**
 * Forwarded credentials go to the SinglePageStartup API only; a request to any
 * other origin is sent exactly as its caller built it.
 */
function isApiServiceRequest(input: RequestInfo | URL) {
  const url = input instanceof Request ? input.url : String(input);

  try {
    return new URL(url).origin === new URL(API_SERVICE_URL).origin;
  } catch {
    return false;
  }
}

function mergeHeaders(
  headers: Headers,
  context: IMcpRequestAuthContext | undefined,
) {
  if (context?.authorization && !headers.has("authorization")) {
    headers.set("authorization", context.authorization);
  }

  if (context?.rbacSecretKey && !headers.has("x-rbac-secret-key")) {
    headers.set("x-rbac-secret-key", context.rbacSecretKey);
  }

  if (!context && process.env["RBAC_SECRET_KEY"]) {
    headers.set("x-rbac-secret-key", process.env["RBAC_SECRET_KEY"]);
  }

  return headers;
}

export function getMcpRequestAuthContext() {
  return authStorage.getStore();
}

export function runWithMcpRequestAuthContext<T>(
  context: IMcpRequestAuthContext,
  callback: () => T,
) {
  return authStorage.run(context, callback);
}

export function installMcpFetchAuthForwarding() {
  if (fetchForwardingInstalled) {
    return;
  }

  fetchForwardingInstalled = true;

  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async (input, init) => {
    if (!isApiServiceRequest(input)) {
      return originalFetch(input, init);
    }

    const context = getMcpRequestAuthContext();
    const request = input instanceof Request ? input : undefined;
    const headers = mergeHeaders(
      new Headers(init?.headers || request?.headers),
      context,
    );

    if (input instanceof Request) {
      return originalFetch(
        new Request(input, {
          ...init,
          headers,
        }),
      );
    }

    return originalFetch(input, {
      ...init,
      headers,
    });
  };
}
