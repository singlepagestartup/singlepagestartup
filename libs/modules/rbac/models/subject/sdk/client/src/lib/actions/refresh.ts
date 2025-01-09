"use client";

import { route, host } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
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

export interface IRefreshMutationFunctionProps {
  data: {
    refresh: string;
  };
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
}

export type IResult = { jwt: string; refresh: string };

export function action(props: IProps) {
  return useMutation<
    { jwt: string; refresh: string },
    DefaultError,
    IRefreshMutationFunctionProps
  >({
    mutationKey: [`${route}/authentication/refresh`],
    mutationFn: async (
      mutationFunctionProps: IRefreshMutationFunctionProps,
    ) => {
      try {
        const { data } = mutationFunctionProps;

        const formData = prepareFormDataToSend({ data });

        const stringifiedQuery = QueryString.stringify(
          mutationFunctionProps.params || props?.params,
          {
            encodeValuesOnly: true,
          },
        );

        const requestOptions: NextRequestOptions = {
          credentials: "include",
          method: "POST",
          body: formData,
          ...(mutationFunctionProps.options || props?.options),
          next: {
            ...(mutationFunctionProps.options?.next || props?.options?.next),
          },
        };
        const res = await fetch(
          `${host}${route}/authentication/refresh?${stringifiedQuery}`,
          requestOptions,
        );

        const json = await responsePipe<{
          data: {
            jwt: string;
            refresh: string;
          };
        }>({
          res,
        });

        const transformedData = transformResponseItem<{
          jwt: string;
          refresh: string;
        }>(json);

        localStorage.setItem("rbac.subject.refresh", transformedData.refresh);
        Cookies.set("rbac.subject.jwt", transformedData.jwt);

        return transformedData;
      } catch (error: any) {
        if (!props?.mute) {
          toast.error(error.message);
        }

        throw error;
      }
    },
    onSuccess(data) {
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/authentication/refresh`,
        props: this,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });

      return data;
    },
    ...props?.reactQueryOptions,
  });
}
