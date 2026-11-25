"use client";

import {
  queryClient,
  appendToListQueries,
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
import { cachePersonalKnowledgeSource } from "./find";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";

export type IProps = {
  mute?: boolean;
  reactQueryOptions?: Partial<UseMutationOptions<any, DefaultError, any>>;
  id: string;
  socialModuleProfileId: string;
  personal?: boolean;
};

export type IResult =
  IParentResult["ISocialModuleProfileFindByIdKnowledgeSourceCreateResult"];

export function action(props: IProps) {
  const { onSuccess: consumerOnSuccess, ...reactQueryOptions } =
    props.reactQueryOptions || {};
  const collectionRoute = `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/knowledge/sources${props.personal ? "/personal" : ""}`;
  const mutationKey = collectionRoute;

  return useMutation<
    IResult,
    DefaultError,
    IParentProps["ISocialModuleProfileFindByIdKnowledgeSourceCreateProps"]
  >({
    mutationKey: [mutationKey],
    mutationFn: async (
      mutationFunctionProps: IParentProps["ISocialModuleProfileFindByIdKnowledgeSourceCreateProps"],
    ) => {
      try {
        const result =
          await api.socialModuleProfileFindByIdKnowledgeSourceCreate({
            ...mutationFunctionProps,
            personal: mutationFunctionProps.personal ?? props.personal,
            options: {
              ...mutationFunctionProps.options,
              headers: saturateHeaders(mutationFunctionProps.options?.headers),
            },
            host: clientHost,
          });

        return result;
      } catch (error: any) {
        if (!props.mute) toast.error(error.message);

        throw error;
      }
    },
    onSuccess(data, variables, onMutateResult, context) {
      const personal = variables.personal ?? props.personal;
      if (personal) {
        cachePersonalKnowledgeSource(variables, data);
        consumerOnSuccess?.(data, variables, onMutateResult, context);
        return data;
      }
      const updatedCollection = `${route}/${variables.id}/social-module/profiles/${variables.socialModuleProfileId}/knowledge/sources`;
      for (const query of queryClient.getQueryCache().findAll({
        predicate: (query) => {
          const key = query.queryKey[0];
          return (
            typeof key === "string" &&
            (key === updatedCollection ||
              key.startsWith(updatedCollection + "?"))
          );
        },
      })) {
        const key = String(query.queryKey[0]);
        if (/[?&](limit|offset)=[^&]+/.test(key))
          void queryClient.invalidateQueries({ queryKey: query.queryKey });
        else appendToListQueries(queryClient, key, data, { exact: true });
      }
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: mutationKey,
        props: this,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });
      consumerOnSuccess?.(data, variables, onMutateResult, context);
      return data;
    },
    ...reactQueryOptions,
  });
}
