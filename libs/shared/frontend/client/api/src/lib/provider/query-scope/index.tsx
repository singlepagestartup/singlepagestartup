"use client";
import { createContext, useContext, useEffect, useId, useRef } from "react";
import { hashKey, useQueryClient } from "@tanstack/react-query";
import type { IQueryScopeProviderProps } from "./interface";
const QueryScopeContext = createContext<string | null>(null);
export function useQueryScope() {
  return useContext(QueryScopeContext);
}
/** Adds ownership without changing the existing principal/host key positions. */
export function scopedQueryOptions(
  scope: string | null,
  key: readonly unknown[],
  meta: Record<string, unknown>,
) {
  return scope
    ? {
        queryKey: [...key, { protectedContentScope: scope }],
        queryHash: undefined,
        queryKeyHashFn: hashKey,
        meta: { ...meta, protectedContentScope: scope },
        gcTime: 0,
      }
    : {};
}
/** Context and lifetime only; the owning SDK keeps its existing QueryClient. */
export function QueryScopeProvider(props: IQueryScopeProviderProps) {
  const client = useQueryClient();
  const instanceId = useId();
  const scope = props.scopeKey ? `${props.scopeKey}:${instanceId}` : null;
  const activeScope = useRef<string | null>(null);
  useEffect(() => {
    activeScope.current = scope;
    return () => {
      activeScope.current = null;
      // Strict Mode replays effects without destroying the mounted observers.
      void Promise.resolve().then(async () => {
        if (activeScope.current === scope) return;
        const filters = {
          predicate: (query: { meta?: Record<string, unknown> }) =>
            query.meta?.protectedContentScope === scope,
        };
        await client.cancelQueries(filters);
        if (activeScope.current === scope) return;
        client.removeQueries(filters);
      });
    };
  }, [client, scope]);
  if (!scope) return null;
  return (
    <QueryScopeContext.Provider value={scope}>
      {props.children}
    </QueryScopeContext.Provider>
  );
}
export type { IQueryScopeProviderProps } from "./interface";
