"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

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
