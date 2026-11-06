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
  knowledgeModuleSourceId: string;
};

export type IResult =
  IParentResult["ISocialModuleProfileFindByIdKnowledgeSourceFindByIdDeleteResult"];

export function action(props: IProps) {
  const { onSuccess: consumerOnSuccess, ...reactQueryOptions } =
    props.reactQueryOptions || {};
  const mutationKey = `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/knowledge/sources/${props.knowledgeModuleSourceId}`;

  return useMutation<
    IResult,
    DefaultError,
    IParentProps["ISocialModuleProfileFindByIdKnowledgeSourceFindByIdDeleteProps"]
  >({
    mutationKey: [mutationKey],
    mutationFn: async (
      mutationFunctionProps: IParentProps["ISocialModuleProfileFindByIdKnowledgeSourceFindByIdDeleteProps"],
    ) => {
      try {
        const result =
          await api.socialModuleProfileFindByIdKnowledgeSourceFindByIdDelete({
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
        removeFromListQueries(queryClient, key, data.id);
      }
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: mutationKey,
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
