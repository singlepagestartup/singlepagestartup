"use client";

import {
  queryClient,
  patchInListQueries,
} from "@sps/shared-frontend-client-api";
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

export type IProps = {
  reactQueryOptions?: Partial<UseMutationOptions<any, DefaultError, any>>;
  id: string;
  socialModuleChatId: string;
  socialModuleThreadId: string;
};

export type IResult =
  IParentResult["ISocialModuleChatFindByIdThreadUpdateResult"];

export function action(props: IProps) {
  const { onSuccess: consumerOnSuccess, ...reactQueryOptions } =
    props.reactQueryOptions || {};
  return useMutation<
    IResult,
    DefaultError,
    IParentProps["ISocialModuleChatFindByIdThreadUpdateProps"]
  >({
    mutationKey: [
      `${route}/${props.id}/social-module/chats/${props.socialModuleChatId}/threads/${props.socialModuleThreadId}`,
    ],
    mutationFn: async (
      mutationFunctionProps: IParentProps["ISocialModuleChatFindByIdThreadUpdateProps"],
    ) => {
      try {
        const result = await api.socialModuleChatFindByIdThreadUpdate({
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
    async onSuccess(...args) {
      const [data, variables] = args;
      const collectionRoute = `${route}/${variables.id}/social-module/chats/${variables.socialModuleChatId}/threads`;
      for (const query of queryClient.getQueryCache().findAll({
        predicate: (query) => {
          const key = query.queryKey[0];
          return (
            typeof key === "string" &&
            (key === collectionRoute || key.startsWith(collectionRoute + "?"))
          );
        },
      }))
        patchInListQueries(
          queryClient,
          String(query.queryKey[0]),
          data.id,
          data,
        );
      patchInListQueries(queryClient, "/api/social/threads", data.id, data);
      queryClient.setQueriesData(
        { queryKey: [`/api/social/threads/${data.id}`] },
        data,
      );
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/${props.id}/social-module/chats/${props.socialModuleChatId}/threads/${props.socialModuleThreadId}`,
        props: variables,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });

      await consumerOnSuccess?.(...args);
    },
    ...reactQueryOptions,
  });
}
