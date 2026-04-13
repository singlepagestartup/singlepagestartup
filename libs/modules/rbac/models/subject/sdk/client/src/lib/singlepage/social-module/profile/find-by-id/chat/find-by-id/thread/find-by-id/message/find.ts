"use client";

import { route, clientHost } from "@sps/rbac/models/subject/sdk/model";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
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

export type IProps =
  IParentProps["ISocialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFindProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<any>>;
    mute?: boolean;
  };

export type IResult =
  IParentResult["ISocialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFindResult"];

export function action(props: IProps) {
  const queryKey = `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/threads/${props.socialModuleThreadId}/messages`;
  const topics = [
    `social.chats.${props.socialModuleChatId}.threads.${props.socialModuleThreadId}.messages`,
    `social.threads.${props.socialModuleThreadId}.messages`,
    "social.messages",
  ];

  useEffect(() => {
    const unsubscribe = subscription(queryKey, queryClient);
    return unsubscribe;
  }, [queryKey]);

  return useQuery<IResult>({
    queryKey: [queryKey],
    meta: {
      topics,
    },
    queryFn: async () => {
      const result =
        await api.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFind(
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
        name: `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/threads/${props.socialModuleThreadId}/messages`,
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
