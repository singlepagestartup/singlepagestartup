"use client";

import { route, host, IModel } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  STALE_TIME,
  transformResponseItem,
} from "@sps/shared-utils";
import { useQuery } from "@tanstack/react-query";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/rbac/models/subject/sdk/server";
import QueryString from "qs";

export type IProps = {
  params: {
    action: {
      route: string;
      method: string;
      type?: "HTTP";
    };
  };
  options?: NextRequestOptions;
  reactQueryOptions?: Parameters<typeof useQuery>[1];
  mute?: boolean;
};

export type IResult = IModel;

export function action(props: IProps) {
  return useQuery<IResult>({
    queryKey: [`${route}/is-authorized`],
    queryFn: async () => {
      const stringifiedQuery = QueryString.stringify(props?.params, {
        encodeValuesOnly: true,
      });

      const requestOptions: NextRequestOptions = {
        credentials: "include",
        ...props.options,
        next: {
          ...props.options?.next,
        },
      };

      const res = await fetch(
        `${host}${route}/is-authorized?${stringifiedQuery}`,
        requestOptions,
      );

      const json = await responsePipe<{ data: IResult }>({
        res,
      });

      const transformedData = transformResponseItem<IResult>(json);

      return transformedData;
    },
    select(data) {
      globalActionsStore.getState().addAction({
        type: "query",
        name: `${route}/is-authorized`,
        props: this,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });

      return data;
    },
    staleTime: STALE_TIME,
    ...props.reactQueryOptions,
  });
}
