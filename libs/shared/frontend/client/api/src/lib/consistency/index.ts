"use client";
import type { Query, QueryClient } from "@tanstack/react-query";
import QueryString from "qs";
import {
  CONSISTENCY_RESPONSE_EVENT,
  type IConsistencyMetadata,
  type IConsistencyDelivery,
} from "@sps/shared-utils";

interface IEntry {
  query: Query<any, any, any, any>;
  metadata: IConsistencyMetadata;
}
const clients = new WeakMap<QueryClient, ReturnType<typeof createClient>>();
const canonical = (value: string) => {
  const url = new URL(value, "http://sps.local");
  return (
    url.pathname +
    "?" +
    QueryString.stringify(QueryString.parse(url.search.slice(1)), {
      sort: (a, b) => a.localeCompare(b),
    })
  );
};
const queryURL = (query: Query<any, any, any, any>) => {
  const [path, params] = query.queryKey;
  if (typeof path !== "string") return "";
  return canonical(
    path +
      ((typeof params === "string" && params.includes("=")) ||
      (params !== null && typeof params === "object")
        ? (path.includes("?") ? "&" : "?") +
          (typeof params === "string" ? params : QueryString.stringify(params))
        : ""),
  );
};
export function consistencyPrincipal(token: string) {
  try {
    const payload = JSON.parse(
      atob(
        (token.split(".")[1] || "").replaceAll("-", "+").replaceAll("_", "/"),
      ),
    );
    const subject = String(payload.subject?.id || payload.sub || "");
    const tenant = payload.tenant?.id || payload.tenantId;
    return subject + (tenant ? `:${tenant}` : "");
  } catch {
    return "";
  }
}

/** No credentials in cache keys; a new principal gets a different query. */
export function consistencyQueryKey(
  path: string,
  params?: unknown,
  host?: string,
) {
  let principal = "";
  if (typeof document !== "undefined") {
    const token = document.cookie
      .split("; ")
      .find((value) => value.startsWith("rbac.subject.jwt="))
      ?.split("=")
      .slice(1)
      .join("=");
    principal = consistencyPrincipal(token || "");
  }
  const search = params
    ? QueryString.stringify(params, {
        encodeValuesOnly: true,
        sort: (a, b) => a.localeCompare(b),
      })
    : undefined;
  return [path, search, ...(principal || host ? [{ principal, host }] : [])];
}

function createClient(client: QueryClient) {
  const entries = new Map<string, IEntry>();
  const listeners = new Set<() => void>();
  const pending = new Map<string, { running: boolean; again: boolean }>();
  let active = false;
  let accepted = new Set<string>();
  const notify = () => listeners.forEach((listener) => listener());
  const invalidate = async (query: Query<any, any, any, any>) => {
    const previous = pending.get(query.queryHash);
    if (previous?.running) {
      previous.again = true;
      return;
    }
    const state = { running: true, again: false };
    pending.set(query.queryHash, state);
    try {
      if (query.state.fetchStatus === "fetching")
        await query.promise?.catch(() => undefined);
      do {
        state.again = false;
        await client.invalidateQueries(
          { queryKey: query.queryKey, exact: true, refetchType: "active" },
          { cancelRefetch: false },
        );
      } while (state.again);
    } finally {
      pending.delete(query.queryHash);
    }
  };
  const response = async (event: Event) => {
    const detail = (
      event as CustomEvent<{ url: string; metadata: IConsistencyMetadata }>
    ).detail;
    if (!detail?.url || detail.metadata?.protocol !== 1) return;
    if (detail.metadata.session) {
      const token =
        document.cookie
          .split("; ")
          .find((value) => value.startsWith("rbac.subject.jwt="))
          ?.slice("rbac.subject.jwt=".length) || "anonymous";
      try {
        const hash = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(token),
        );
        const session = Array.from(new Uint8Array(hash), (v) =>
          v.toString(16).padStart(2, "0"),
        ).join("");
        if (session !== detail.metadata.session) return;
      } catch {
        return;
      }
    }
    const identity = canonical(detail.url);
    const queries = client.getQueryCache().findAll({
      predicate: (query) => {
        const partition = query.queryKey[2] as { host?: string } | undefined;
        return (
          queryURL(query) === identity &&
          (!partition?.host ||
            new URL(partition.host, detail.url).origin ===
              new URL(detail.url).origin)
        );
      },
    });
    for (const query of queries)
      entries.set(query.queryHash, { query, metadata: detail.metadata });
    if (queries.length) notify();
  };
  const cleanup = client.getQueryCache().subscribe((event) => {
    if (event.type === "updated" && event.query.state.status === "error") {
      const status = (event.query.state.error as { status?: number } | null)
        ?.status;
      if (status === 401 || status === 403) {
        entries.delete(event.query.queryHash);
        if (event.query.state.data !== undefined)
          event.query.setState({ data: undefined });
        notify();
      }
    }
    if (event.type === "removed") {
      entries.delete(event.query.queryHash);
      notify();
    }
    if (event.type === "observerAdded" || event.type === "observerRemoved")
      notify();
  });
  if (typeof window !== "undefined")
    window.addEventListener(CONSISTENCY_RESPONSE_EVENT, response);
  return {
    setConnected(value: boolean) {
      active = value;
      if (!value) accepted.clear();
    },
    covered(query: Query<any, any, any, any>) {
      const entry = entries.get(query.queryHash);
      return (
        active &&
        !!entry &&
        accepted.has(entry.metadata.ref) &&
        Date.parse(entry.metadata.expiresAt) > Date.now()
      );
    },
    snapshot() {
      return [...entries.values()].filter(
        (entry) => entry.query.getObserversCount() > 0,
      );
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    receive(message: IConsistencyDelivery) {
      if (message.protocol !== 1) return;
      if (message.type === "ready") accepted = new Set(message.refs || []);
      const refs = new Set(message.type === "ready" ? [] : message.refs || []);
      for (const { query, metadata } of entries.values()) {
        if (message.renewedRefs?.includes(metadata.ref) && message.expiresAt)
          metadata.expiresAt = message.expiresAt;
        if (refs.has(metadata.ref))
          void invalidate(query).catch(() => undefined);
      }
    },
    async check(
      checker: (refs: string[]) => Promise<{
        refs: string[];
        renewedRefs?: string[];
        expiresAt?: string;
      }>,
    ) {
      const refs = this.snapshot().map((entry) => entry.metadata.ref);
      if (!refs.length) return;
      for (let i = 0; i < refs.length; i += 100) {
        const result = await checker(refs.slice(i, i + 100));
        this.receive({
          protocol: 1,
          type: "resync",
          epoch: "",
          cursor: "0",
          ...result,
        });
      }
    },
    clear() {
      entries.clear();
      active = false;
      notify();
    },
    destroy() {
      cleanup();
      if (typeof window !== "undefined")
        window.removeEventListener(CONSISTENCY_RESPONSE_EVENT, response);
      listeners.clear();
    },
  };
}
export function queryConsistency(client: QueryClient) {
  let state = clients.get(client);
  if (!state) {
    state = createClient(client);
    clients.set(client, state);
  }
  return state;
}
