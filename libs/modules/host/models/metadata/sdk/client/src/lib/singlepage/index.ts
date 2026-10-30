"use client";

import {
  IModel,
  route,
  clientHost,
  query,
  options,
} from "@sps/host/models/metadata/sdk/model";
import { useQuery } from "@tanstack/react-query";
import type {
  IPageSeoResult,
  ISeoPreviewProps,
} from "@sps/host/models/metadata/sdk/model";
import { responsePipe, transformResponseItem } from "@sps/shared-utils";
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
  preview: (props: ISeoPreviewProps) =>
    useQuery<IPageSeoResult>({
      queryKey: ["host.metadata.preview", props],
      enabled: false,
      gcTime: 0,
      retry: false,
      queryFn: async () => {
        const response = await fetch(`${clientHost}${route}/preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(props),
          cache: "no-store",
        });
        const result = await responsePipe<{ data: IPageSeoResult }>({
          res: response,
        });
        return transformResponseItem<IPageSeoResult>(result);
      },
    }),
};
