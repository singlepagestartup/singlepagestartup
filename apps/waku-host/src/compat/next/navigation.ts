"use client";

import { useMemo } from "react";
import { useRouter_UNSTABLE as useWakuRouter } from "waku/router/client";
import { toWakuPath } from "../../lib/routing";

export function useRouter() {
  const router = useWakuRouter();

  return useMemo(
    () => ({
      back: () => router.back(),
      forward: () => router.forward(),
      prefetch: (href: string) => router.prefetch(toWakuPath(href)),
      push: (href: string, options?: { scroll?: boolean }) =>
        router.push(toWakuPath(href), options),
      refresh: () => router.reload(),
      replace: (href: string, options?: { scroll?: boolean }) =>
        router.replace(toWakuPath(href), options),
    }),
    [router],
  );
}

export function usePathname() {
  const router = useWakuRouter();

  return router.path;
}

export function useSearchParams() {
  const router = useWakuRouter();

  return useMemo(() => new URLSearchParams(router.query), [router.query]);
}
