"use client";

import { WagmiProvider, deserialize, serialize } from "wagmi";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { IComponentProps } from "./interface";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1_000 * 60 * 60 * 24, // 24 hours
    },
  },
});

export const persister = createSyncStoragePersister({
  serialize,
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
  deserialize,
});

export function Component(props: IComponentProps) {
  return (
    <WagmiProvider config={props.config}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        {props.children}
      </PersistQueryClientProvider>
    </WagmiProvider>
  );
}
