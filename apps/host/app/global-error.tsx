"use client";

import "../styles/fonts.css";
import "../styles/tailwind.css";

import { fonts } from "./fonts";
import { useEffect, useState } from "react";
import { api as hostModulePageApi } from "@sps/host/models/page/sdk/server";
import { IModel } from "@sps/host/models/page/sdk/model";
import { Button } from "@sps/shared-ui-shadcn";
import { Component as HostModulePage } from "@sps/host/models/page/frontend/component";
import { internationalization } from "@sps/shared-configuration";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [hostModulePage, setHostModulePage] = useState<IModel>();

  useEffect(() => {
    console.error("GlobalError error:", error);
  }, [error]);

  useEffect(() => {
    hostModulePageApi
      .find({
        params: {
          filters: {
            and: [
              {
                column: "url",
                method: "eq",
                value: "/500",
              },
            ],
          },
        },
      })
      .then((pages) => {
        if (!pages) {
          return;
        }

        if (pages.length > 0) {
          setHostModulePage(pages[0]);
        }
      })
      .catch((error) => {
        console.error("api.fetch error:", error);
      });
  }, []);

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

  if (hostModulePage) {
    return (
      <html className="scroll-smooth">
        <body
          className={`${fonts.defaultFont.variable} ${fonts.primaryFont.variable}`}
        >
          <div className="relative">
            <HostModulePage
              isServer={false}
              variant="default"
              data={hostModulePage}
              language={internationalization.defaultLanguage.code}
              url={hostModulePage.url}
            />
          </div>
        </body>
      </html>
    );
  }

  return (
    <html className="scroll-smooth">
      <body
        className={`${fonts.defaultFont.variable} ${fonts.primaryFont.variable}`}
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center w-full text-center gap-3 min-h-screen">
          <p className="text-sm">{error?.message}</p>
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
