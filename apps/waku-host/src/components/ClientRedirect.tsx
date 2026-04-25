"use client";

import { useEffect } from "react";
import { useRouter_UNSTABLE as useRouter } from "waku/router/client";
import { toWakuPath } from "../lib/routing";

export function ClientRedirect(props: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(toWakuPath(props.to));
  }, [props.to, router]);

  return null;
}
