"use client";

import { route } from "@sps/rbac/models/subject/sdk/model";
import {
  DefaultError,
  useMutation,
  UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/rbac/models/subject/sdk/server";
import Cookies from "js-cookie";

export type IProps = {
  reactQueryOptions?: Partial<UseMutationOptions<any, DefaultError, any>>;
  mute?: boolean;
};

export type IResult = IParentResult["IAuthenticationRefreshResult"];

export function action(props: IProps) {
  return useMutation<
    IResult,
    DefaultError,
    IParentProps["IAuthenticationRefreshProps"]
  >({
    mutationKey: [`${route}/authentication/refresh`],
    mutationFn: async (
      mutationFunctionProps: IParentProps["IAuthenticationRefreshProps"],
    ) => {
      try {
        const result = await api.authenticationRefresh({
          ...mutationFunctionProps,
        });

        localStorage.setItem("rbac.subject.refresh", result.refresh);
        Cookies.set("rbac.subject.jwt", result.jwt);

        return result;
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
