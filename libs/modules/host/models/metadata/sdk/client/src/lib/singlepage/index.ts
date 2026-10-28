"use client";

import {
  IModel,
  route,
  clientHost,
  query,
  options,
} from "@sps/host/models/metadata/sdk/model";
import { useQuery } from "@tanstack/react-query";
import type { IPageSeoResult } from "@sps/host/models/metadata/sdk/server";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";

export type IProps = {};

export type IResult = {};

export const api = {
  ...factory<IModel>({
    queryClient,
    route,
    host: clientHost,
    params: query,
    options,
  }),
  preview: (props: {
    url: string;
    language: string;
    metadata: Partial<IModel>;
  }) =>
    useQuery<IPageSeoResult>({
      queryKey: ["host.metadata.preview", props],
      enabled: false,
      gcTime: 0,
      queryFn: async () => {
        const response = await fetch("/api/seo-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(props),
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Preview failed");
        return result;
      },
    }),
};
