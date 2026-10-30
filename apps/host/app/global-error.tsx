"use client";

import "../styles/fonts.css";
import "../styles/tailwind.css";
import { fonts } from "./fonts";
import { useEffect } from "react";
import { internationalization } from "@sps/shared-configuration";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Host rendering failed", error);
  }, [error]);
  return (
    <html lang={internationalization.defaultLanguage.code}>
      <head>
        <title>Something went wrong</title>
        <meta name="robots" content="noindex" />
      </head>
      <body
        className={`${fonts.defaultFont.variable} ${fonts.primaryFont.variable}`}
      >
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground focus-visible:outline focus-visible:outline-2"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
