"use client";

import { route, clientHost } from "@sps/rbac/models/subject/sdk/model";
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
};

export type IResult = IParentResult["IAuthenticationLogoutResult"];

export function action(props: IProps) {
  return useMutation<
    IResult,
    DefaultError,
    IParentProps["IAuthenticationLogoutProps"]
  >({
    mutationKey: [`${route}/authentication/logout`],
    mutationFn: async (
      mutationFunctionProps: IParentProps["IAuthenticationLogoutProps"],
    ) => {
      try {
        const result = await api.authenticationLogout({
          ...mutationFunctionProps,
          host: clientHost,
        });

        localStorage.removeItem("rbac.subject.refresh");
        Cookies.remove("rbac.subject.jwt");
        window.location.replace(mutationFunctionProps.redirectTo);

        return result;
      } catch (error: any) {
        toast.error(error.message);

        throw error;
      }
    },
    onSuccess(data) {
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/authentication/logout`,
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
