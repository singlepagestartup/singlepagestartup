"use client";

import { createContext, useEffect } from "react";
import { queryClient } from "@sps/shared-frontend-client-api";
import type { IProtectedMediaProviderProps } from "./interface";

export const ProtectedMediaContext = createContext<string | null>(null);

function Scope(props: IProtectedMediaProviderProps) {
  useEffect(() => {
    const scopeKey = props.scopeKey;
    return () => {
      const filters = {
        predicate: (query: { meta?: Record<string, unknown> }) =>
          query.meta?.protectedMediaScope === scopeKey,
      };
      void queryClient.cancelQueries(filters);
      queryClient.removeQueries(filters);
    };
  }, [props.scopeKey]);

  return (
    <ProtectedMediaContext.Provider value={props.scopeKey}>
      {props.children}
    </ProtectedMediaContext.Provider>
  );
}

/** Lifetime boundary only; the owning domain retains its SDK Provider and access gate. */
export function ProtectedMediaProvider(props: IProtectedMediaProviderProps) {
  if (!props.scopeKey) return null;
  return (
    <Scope key={props.scopeKey} scopeKey={props.scopeKey}>
      {props.children}
    </Scope>
  );
}
