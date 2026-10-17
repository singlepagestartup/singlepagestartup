"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryConsistency } from "../consistency";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});
// Register before query effects can complete their first request.
queryConsistency(queryClient);

export function Provider({
  children,
  showDevTools = false,
}: {
  children: React.ReactNode;
  showDevTools?: boolean;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {showDevTools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
