"use client";

import { route, clientHost } from "@sps/rbac/models/subject/sdk/model";
import {
  DefaultError,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/rbac/models/subject/sdk/server";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import { queryClient, subscription } from "@sps/shared-frontend-client-api";
import { STALE_TIME } from "@sps/shared-utils";
import { useEffect } from "react";
import { toast } from "sonner";

export type IFindProps =
  IParentProps["ISocialModuleProfileFindByIdChatFindByIdOpenrouterModelFavoriteFindProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<any>>;
    mute?: boolean;
  };

export type IUpdateProps = {
  reactQueryOptions?: Partial<UseMutationOptions<any, DefaultError, any>>;
  id: string;
  socialModuleProfileId: string;
  socialModuleChatId: string;
};

export type IResult =
  IParentResult["ISocialModuleProfileFindByIdChatFindByIdOpenrouterModelFavoriteFindResult"];

export function find(props: IFindProps) {
  const queryKey = `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/openrouter/model-favorites`;

  useEffect(() => {
    const unsubscribe = subscription(queryKey, queryClient);
    return unsubscribe;
  }, [queryKey]);

  return useQuery<IResult>({
    queryKey: [queryKey],
    queryFn: async () => {
      const result =
        await api.socialModuleProfileFindByIdChatFindByIdOpenrouterModelFavoriteFind(
          {
            ...props,
            options: {
              ...props.options,
              headers: saturateHeaders(props.options?.headers),
            },
            host: clientHost,
          },
        );

      return result;
    },
    select(data) {
      globalActionsStore.getState().addAction({
        type: "query",
        name: queryKey,
        props: this,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });

      return data;
    },
    staleTime: STALE_TIME,
    ...props.reactQueryOptions,
  });
}

export function update(props: IUpdateProps) {
  const mutationKey = `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/openrouter/model-favorites`;

  return useMutation<
    IResult,
    DefaultError,
    IParentProps["ISocialModuleProfileFindByIdChatFindByIdOpenrouterModelFavoriteUpdateProps"]
  >({
    mutationKey: [mutationKey],
    mutationFn: async (
      mutationFunctionProps: IParentProps["ISocialModuleProfileFindByIdChatFindByIdOpenrouterModelFavoriteUpdateProps"],
    ) => {
      try {
        const result =
          await api.socialModuleProfileFindByIdChatFindByIdOpenrouterModelFavoriteUpdate(
            {
              ...mutationFunctionProps,
              options: {
                ...mutationFunctionProps.options,
                headers: saturateHeaders(
                  mutationFunctionProps.options?.headers,
                ),
              },
              host: clientHost,
            },
          );

        queryClient.setQueryData([mutationKey], result);

        return result;
      } catch (error: any) {
        toast.error(error.message);

        throw error;
      }
    },
    onSuccess(data) {
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
