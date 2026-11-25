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
import {
  invalidateRouteQueries,
  queryClient,
} from "@sps/shared-frontend-client-api";

export type IProps = {
  reactQueryOptions?: Partial<UseMutationOptions<any, DefaultError, any>>;
  id: string;
  socialModuleProfileId: string;
  socialModuleChatId: string;
  targetSocialModuleProfileId: string;
};

export type IResult =
  IParentResult["ISocialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdateResult"];

export function action(props: IProps) {
  const chatRoute = `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}`;
  const mutationKey = `${chatRoute}/profiles/${props.targetSocialModuleProfileId}`;
  const { onSuccess, ...options } = props.reactQueryOptions ?? {};

  return useMutation<
    IResult,
    DefaultError,
    IParentProps["ISocialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdateProps"]
  >({
    mutationKey: [mutationKey],
    mutationFn: async (
      mutationFunctionProps: IParentProps["ISocialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdateProps"],
    ) => {
      try {
        return await api.socialModuleProfileFindByIdChatFindByIdProfileFindByIdUpdate(
          {
            ...mutationFunctionProps,
            options: {
              ...mutationFunctionProps.options,
              headers: saturateHeaders(mutationFunctionProps.options?.headers),
            },
            host: clientHost,
          },
        );
      } catch (error: any) {
        toast.error(error.message);
        throw error;
      }
    },
    ...options,
    async onSuccess(data, variables, result, context) {
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: mutationKey,
        props: this,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });

      await Promise.all([
        invalidateRouteQueries(queryClient, chatRoute),
        invalidateRouteQueries(
          queryClient,
          `${route}/${props.id}/crm-module/workspace/employee`,
        ),
      ]);
      return onSuccess?.(data, variables, result, context);
    },
  });
}
