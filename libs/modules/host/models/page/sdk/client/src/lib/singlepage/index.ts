"use client";
import type {
  IPageSeoResult,
  ISeoPreviewProps,
} from "@sps/host/models/page/sdk/model";

import {
  type IResolvedPage,
  IModel,
  route,
  clientHost,
  query,
  options,
} from "@sps/host/models/page/sdk/model";
import {
  factory,
  queryClient,
  subscription,
} from "@sps/shared-frontend-client-api";
import { useEffect } from "react";
import {
  NextRequestOptions,
  responsePipe,
  STALE_TIME,
  transformResponseItem,
} from "@sps/shared-utils";
import { useQuery } from "@tanstack/react-query";
import QueryString from "qs";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import { toast } from "sonner";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

export interface IFindByUrlProps {
  url: string;
  language?: string;
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
}

export interface IUrlSegmentValueProps {
  url: string;
  language?: string;
  segment: string;
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
}

export type IProps = {
  ISeoPreviewProps: ISeoPreviewProps;
  IUrlSegmentValueProps: IUrlSegmentValueProps;
  IFindByUrlProps: IFindByUrlProps;
};

export type IResult = {
  ISeoPreviewProps: IPageSeoResult;
  IUrlSegmentValueProps: string | null;
  IFindByUrlProps: IResolvedPage;
};

export const api = {
  ...factory<IModel>({
    queryClient,
    route,
    host: clientHost,
    params: query,
    options,
  }),
  findByUrl: (props: IFindByUrlProps) => {
    const stringifiedQuery = QueryString.stringify(
      {
        ...props.params,
        url: props.url,
        language: props.language ?? props.params?.language,
      },
      { encodeValuesOnly: true },
    );
    const queryKey = `${route}/find-by-url?${stringifiedQuery}`;
    useEffect(() => subscription(queryKey, queryClient), [queryKey]);
    return useQuery<IResolvedPage>({
      queryKey: [queryKey],
      meta: { topics: ["host.pages"] },
      queryFn: async () => {
        try {
          const noCache = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;
          const cacheControlOptions: NextRequestOptions["headers"] = noCache
            ? { "Cache-Control": "no-store" }
            : {};

          const requestOptions: NextRequestOptions = {
            credentials: "include",
            method: "GET",
            headers: {
              ...cacheControlOptions,
              ...options?.headers,
            },
            next: {
              ...props?.options?.next,
            },
          };

          const res = await fetch(
            `${clientHost}${route}/find-by-url?${stringifiedQuery}`,
            requestOptions,
          );

          const json = await responsePipe<{ data: IResolvedPage }>({
            res,
          });

          const transformedData = transformResponseItem<IResolvedPage>(json);

          return transformedData;
        } catch (error: any) {
          toast.error(error.message);

          throw error;
        }
      },
      select(data) {
        globalActionsStore.getState().addAction({
          type: "query",
          name: `${route}/find-by-url`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
      staleTime: STALE_TIME,
    });
  },
  urlSegmentValue: (props: IUrlSegmentValueProps) => {
    const { url, segment } = props;

    const stringifiedQuery = QueryString.stringify(
      {
        ...props?.params,
        url,
        segment,
        language: props.language ?? props.params?.language,
      },
      {
        encodeValuesOnly: true,
      },
    );
    const queryKey = `${route}/url-segment-value?${stringifiedQuery}`;
    useEffect(() => subscription(queryKey, queryClient), [queryKey]);
    return useQuery<string | null>({
      queryKey: [queryKey],
      meta: { topics: ["host.pages"] },
      queryFn: async () => {
        try {
          const noCache = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;
          const cacheControlOptions: NextRequestOptions["headers"] = noCache
            ? { "Cache-Control": "no-store" }
            : {};

          const requestOptions: NextRequestOptions = {
            credentials: "include",
            headers: {
              ...cacheControlOptions,
              ...options?.headers,
            },
            next: {
              ...props?.options?.next,
            },
          };

          const res = await fetch(
            `${clientHost}${route}/url-segment-value?${stringifiedQuery}`,
            requestOptions,
          );

          const json = await responsePipe<{ data: string | null }>({
            res,
          });

          const transformedData = transformResponseItem<string | null>(json);

          return transformedData ?? null;
        } catch (error: any) {
          toast.error(error.message);

          throw error;
        }
      },
      select(data) {
        globalActionsStore.getState().addAction({
          type: "query",
          name: `${route}/url-segment-value?${stringifiedQuery}`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
      staleTime: STALE_TIME,
    });
  },
  previewSeo: (props: ISeoPreviewProps) =>
    useQuery<IPageSeoResult>({
      queryKey: ["host.pages.seo-preview", props],
      enabled: false,
      gcTime: 0,
      retry: false,
      queryFn: async () => {
        const response = await fetch(`${clientHost}${route}/seo-preview`, {
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
