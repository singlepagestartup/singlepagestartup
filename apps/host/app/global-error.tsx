"use client";

import "../styles/fonts.css";
import "../styles/tailwind.css";

import { fonts } from "./fonts";
import { GlobalError as SpsHostGlobalError } from "@sps/host/frontend/component";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SpsHostGlobalError error={error} reset={reset} fonts={fonts} />;
}
