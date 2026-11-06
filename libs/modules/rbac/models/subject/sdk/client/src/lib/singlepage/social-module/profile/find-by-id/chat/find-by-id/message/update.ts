"use client";

import { route, clientHost } from "@sps/rbac/models/subject/sdk/model";
import {
  DefaultError,
  useMutation,
  UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import {
  queryClient,
  patchInListQueries,
} from "@sps/shared-frontend-client-api";
import { createId } from "@paralleldrive/cuid2";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/rbac/models/subject/sdk/server";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";

export type IProps = {
  reactQueryOptions?: Partial<UseMutationOptions<any, DefaultError, any>>;
  id: string;
  socialModuleProfileId: string;
  socialModuleChatId: string;
  socialModuleMessageId: string;
};

export type IResult =
  IParentResult["ISocialModuleProfileFindByIdChatFindByIdMessageUpdateResult"];

export function action(props: IProps) {
  const { onSuccess: consumerOnSuccess, ...reactQueryOptions } =
    props.reactQueryOptions || {};
  return useMutation<
    IResult,
    DefaultError,
    IParentProps["ISocialModuleProfileFindByIdChatFindByIdMessageUpdateProps"]
  >({
    mutationKey: [
      `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/messages/${props.socialModuleMessageId}`,
    ],
    mutationFn: async (
      mutationFunctionProps: IParentProps["ISocialModuleProfileFindByIdChatFindByIdMessageUpdateProps"],
    ) => {
      try {
        const result =
          await api.socialModuleProfileFindByIdChatFindByIdMessageUpdate({
            ...mutationFunctionProps,
            options: {
              ...mutationFunctionProps.options,
              headers: saturateHeaders(mutationFunctionProps.options?.headers),
            },
            host: clientHost,
          });

        return result;
      } catch (error: any) {
        toast.error(error.message);

        throw error;
      }
    },
    async onSuccess(data, variables, context) {
      const prefix = `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/`;
      for (const query of queryClient.getQueryCache().findAll({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].startsWith(prefix) &&
          query.queryKey[0].endsWith("/messages"),
      })) {
        if (data?.id)
          patchInListQueries(
            queryClient,
            query.queryKey[0] as string,
            data.id,
            data,
          );
      }

      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/messages/${props.socialModuleMessageId}`,
        props: variables,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });

      await consumerOnSuccess?.(data, variables, context);
    },
    ...reactQueryOptions,
  });
}
