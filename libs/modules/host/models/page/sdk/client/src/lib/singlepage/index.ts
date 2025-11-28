"use client";

import {
  IModel,
  route,
  clientHost,
  query,
  options,
} from "@sps/host/models/page/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
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
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
}

export interface IUrlSegmentValueProps {
  url: string;
  segment: string;
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
}

export type IProps = {
  IUrlSegmentValueProps: IUrlSegmentValueProps;
  IFindByUrlProps: IFindByUrlProps;
};

export type IResult = {
  IUrlSegmentValueProps: string;
  IFindByUrlProps: IModel;
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
    return useQuery<IModel>({
      queryKey: [`${route}/find-by-url`],
      queryFn: async () => {
        try {
          const { url } = props;

          const stringifiedQuery = QueryString.stringify(
            { ...props?.params, url },
            {
              encodeValuesOnly: true,
            },
          );

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

          const json = await responsePipe<{ data: IModel }>({
            res,
          });

          const transformedData = transformResponseItem<IModel>(json);

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
      { ...props?.params, url, segment },
      {
        encodeValuesOnly: true,
      },
    );

    return useQuery<string>({
      queryKey: [`${route}/url-segment-value?${stringifiedQuery}`],
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

          const json = await responsePipe<{ data: string }>({
            res,
          });

          const transformedData = transformResponseItem<string>(json);

          return transformedData;
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
};
