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
import { saturateHeaders } from "@sps/shared-frontend-client-utils";

import { readAuthenticationTokens } from "../persist-authentication-tokens";
import { readSocialModuleProfileSelections } from "../../social-module/profile/active-selection";

export type IProps = {
  reactQueryOptions?: Partial<UseMutationOptions<any, DefaultError, any>>;
  mute?: boolean;
};

export type IResult = IParentResult["IAuthenticationOAuthStartResult"];

export function action(props: IProps) {
  return useMutation<
    IResult,
    DefaultError,
    IParentProps["IAuthenticationOAuthStartProps"]
  >({
    mutationKey: [`${route}/authentication/oauth/start`],
    mutationFn: async (
      mutationFunctionProps: IParentProps["IAuthenticationOAuthStartProps"],
    ) => {
      try {
        const result = await api.authenticationOAuthStart({
          ...mutationFunctionProps,
          data: {
            guestSessionToken: readAuthenticationTokens().jwt,
            socialModuleProfileSelections: readSocialModuleProfileSelections(),
            ...mutationFunctionProps.data,
          },
          options: {
            ...mutationFunctionProps.options,
            headers: saturateHeaders(mutationFunctionProps.options?.headers),
          },
          host: clientHost,
        });

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
        name: `${route}/authentication/oauth/start`,
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
