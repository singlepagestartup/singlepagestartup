"use client";

import { useEffect, useState } from "react";
import { Component as Page } from "@sps/host/models/page/frontend/component";
import { api } from "@sps/host/models/page/sdk/server";
import { NextFontWithVariable } from "next/dist/compiled/@next/font";
import { IModel } from "@sps/host/models/page/sdk/model";
import { Button } from "@sps/shared-ui-shadcn";

export function Component({
  error,
  reset,
  fonts,
  children,
}: {
  fonts: {
    defaultFont: NextFontWithVariable;
    primaryFont: NextFontWithVariable;
  };
  error: Error & { digest?: string };
  children?: React.ReactNode;
  reset: () => void;
}) {
  const [page, setPage] = useState<IModel>();

  useEffect(() => {
    console.error("GlobalError error:", error);
  }, [error]);

  useEffect(() => {
    api
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
          setPage(pages[0]);
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

  if (page) {
    return (
      <html className="scroll-smooth">
        <body
          className={`${fonts.defaultFont.variable} ${fonts.primaryFont.variable}`}
        >
          <div className="relative">
            {/* <Page
              isServer={false}
              variant="default"
              hostUrl={page.url}
              data={{
                url: page.url,
              }}
            /> */}
          </div>
        </body>
      </html>
    );
  }

  if (children) {
    <html className="scroll-smooth">
      <body
        className={`${fonts.defaultFont.variable} ${fonts.primaryFont.variable}`}
      >
        {children}
      </body>
    </html>;
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
