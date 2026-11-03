"use client";

import {
  queryClient,
  appendToListQueries,
  patchInListQueries,
  removeFromListQueries,
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
  socialModuleProfileId: string;
  socialModuleChatId: string;
  targetSocialModuleProfileId: string;
  knowledgeModuleSourceId: string;
};

export type IResult =
  IParentResult["ISocialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdUpdateResult"];

export function action(props: IProps) {
  const { onSuccess: consumerOnSuccess, ...reactQueryOptions } =
    props.reactQueryOptions || {};
  const mutationKey = `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/profiles/${props.targetSocialModuleProfileId}/knowledge/sources/${props.knowledgeModuleSourceId}`;

  return useMutation<
    IResult,
    DefaultError,
    IParentProps["ISocialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdUpdateProps"]
  >({
    mutationKey: [mutationKey],
    mutationFn: async (
      mutationFunctionProps: IParentProps["ISocialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdUpdateProps"],
    ) => {
      try {
        return await api.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdUpdate(
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
    onSuccess(data, variables, context) {
      const collectionRoute =
        mutationKey.split("/knowledge/sources")[0] + "/knowledge/sources";
      for (const query of queryClient.getQueryCache().findAll({
        predicate: (query) => {
          const key = query.queryKey[0];
          return (
            typeof key === "string" &&
            (key === collectionRoute || key.startsWith(collectionRoute + "?"))
          );
        },
      })) {
        const key = String(query.queryKey[0]);
        patchInListQueries(queryClient, key, data.id, data);
      }
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: mutationKey,
        props: this,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });

      consumerOnSuccess?.(data, variables, context);
      return data;
    },
    ...reactQueryOptions,
  });
}
