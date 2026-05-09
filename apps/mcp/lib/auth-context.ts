import { AsyncLocalStorage } from "node:async_hooks";

export type IMcpRequestAuthContext = {
  authorization?: string;
  rbacSecretKey?: string;
  clientId?: string;
  scopes?: string[];
  expiresAt?: number;
};

const authStorage = new AsyncLocalStorage<IMcpRequestAuthContext>();

let fetchForwardingInstalled = false;

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
