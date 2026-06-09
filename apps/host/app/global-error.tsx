"use client";

import "../styles/fonts.css";
import "../styles/tailwind.css";

import { fonts } from "./fonts";
import { useEffect } from "react";
import { Button } from "@sps/shared-ui-shadcn";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("GlobalError error:", error);
  }, [error]);

  async function revalidate() {
    await fetch("/api/revalidation/revalidate?path=/&type=layout").then(() => {
      reset();
      window.location.reload();
    });
  }

  useEffect(() => {
    if (
      error.message.includes(
        "An error occurred in the Server Components render.",
      )
    ) {
      fetch("/api/revalidation/revalidate?path=/&type=layout").then(() => {
        reset();
        window.location.reload();
      });
    }
  }, [error.message]);

  return (
    <html className="scroll-smooth">
      <body
        className={`${fonts.defaultFont.variable} ${fonts.primaryFont.variable}`}
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center w-full text-center gap-3 min-h-screen px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Internal error
          </p>
          <h1 className="text-3xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {error?.message}
          </p>
          <Button
            variant="default"
            onClick={revalidate}
            className="w-fit mx-auto"
          >
            Reload
          </Button>
        </div>
      </body>
    </html>
  );
}
