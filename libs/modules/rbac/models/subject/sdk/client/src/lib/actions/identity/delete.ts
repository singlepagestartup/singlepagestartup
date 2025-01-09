"use client";

import { route } from "@sps/rbac/models/subject/sdk/model";
import { NextRequestOptions } from "@sps/shared-utils";
import { DefaultError, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/rbac/models/subject/sdk/server";

export type IProps = {
  id: IParentProps["IIdentityDeleteProps"]["id"];
  identityId: IParentProps["IIdentityDeleteProps"]["identityId"];
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
  reactQueryOptions?: Parameters<typeof useQuery>[1];
};

export type IResult = { jwt: string; refresh: string };

export function action(props: IProps) {
  return useMutation<
    IParentResult["IIdentityDeleteResult"],
    DefaultError,
    IParentProps["IIdentityDeleteProps"]
  >({
    mutationKey: [`${route}/${props.id}/identities/${props.identityId}`],
    mutationFn: async (
      mutationFunctionProps: IParentProps["IIdentityDeleteProps"],
    ) => {
      try {
        const result = await api.identityDelete({
          ...mutationFunctionProps,
        });

        return result;
      } catch (error: any) {
        toast.error(error.message);

        throw error;
      }
    },
    onSuccess(data) {
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/${props.id}/identities/${props.identityId}`,
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
