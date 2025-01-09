"use client";

import { route, host, IModel } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  STALE_TIME,
  transformResponseItem,
} from "@sps/shared-utils";
import { DefaultError, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/rbac/models/subject/sdk/server";
import QueryString from "qs";
import Cookies from "js-cookie";

export type IProps = {
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
  reactQueryOptions?: Parameters<typeof useQuery>[1];
  mute?: boolean;
};

export type IResult = IModel;

export function action(props: IProps) {
  return useQuery<IResult>({
    queryKey: [`${route}/logout`],
    queryFn: async () => {
      try {
        const stringifiedQuery = QueryString.stringify(props?.params, {
          encodeValuesOnly: true,
        });

        const requestOptions: NextRequestOptions = {
          credentials: "include",
          ...props.options,
          cache: "no-cache",
          next: {
            ...props.options?.next,
            cache: "no-store",
          },
        };

        const res = await fetch(
          `${host}${route}/logout?${stringifiedQuery}`,
          requestOptions,
        );

        const json = await responsePipe<{ data: IResult }>({
          res,
        });

        const transformedData = transformResponseItem<IResult>(json);

        localStorage.removeItem("rbac.subject.refresh");
        Cookies.remove("rbac.subject.jwt");

        return transformedData;
      } catch (error: any) {
        toast.error(error.message);

        throw error;
      }
    },
    select(data) {
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/logout`,
        props: this,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });

      return data;
    },
    staleTime: STALE_TIME,
    ...props?.reactQueryOptions,
  });
}
