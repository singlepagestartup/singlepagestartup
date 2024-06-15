"use client";

import { useEffect, useState } from "react";
import { Component as Page } from "@sps/sps-website-builder-models-page-frontend-component";
import { api } from "@sps/sps-website-builder-models-page-frontend-api-server";
import { NextFontWithVariable } from "next/dist/compiled/@next/font";
import { IModel } from "@sps/sps-website-builder-models-page-contracts-extended";

export function GlobalError({
  error,
  reset,
  fonts,
}: {
  fonts: {
    defaultFont: NextFontWithVariable;
    primaryFont: NextFontWithVariable;
  };
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [page, setPage] = useState<IModel>();

  useEffect(() => {
    console.error("GlobalError error:", error);
  }, [error]);

  useEffect(() => {
    api.fetch
      .find({
        filters: {
          and: [
            {
              column: "url",
              method: "eq",
              value: "/500",
            },
          ],
        },
      })
      .then((pages) => {
        if (pages.length > 0) {
          setPage(pages[0]);
        }
      })
      .catch((error) => {
        console.error("api.fetch error:", error);
      });
  }, []);

  if (page) {
    return (
      <html className="scroll-smooth">
        <body
          className={`${fonts.defaultFont.variable} ${fonts.primaryFont.variable}`}
        >
          <div className="relative">
            <Page
              isServer={false}
              variant="default"
              hostUrl={page.url}
              data={{
                url: page.url,
              }}
            />
          </div>
        </body>
      </html>
    );
  }

  return (
    <html>
      <body>
        <div>
          <p className="text-sm">{error?.message}</p>
        </div>
      </body>
    </html>
  );
}
