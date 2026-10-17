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
import {
  queryClient,
  subscription,
  consistencyQueryKey,
} from "@sps/shared-frontend-client-api";
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
  // Merge caller meta last but never let it clobber topics (issue #195): a
  // project passing reactQueryOptions.meta must not silently drop the realtime
  // topic subscription.
  const { meta: userMeta, ...restReactQueryOptions } =
    props.reactQueryOptions ?? {};

  useEffect(() => {
    const unsubscribe = subscription(queryKey, queryClient);
    return unsubscribe;
  }, [queryKey]);

  return useQuery<IResult>({
    queryKey: consistencyQueryKey(queryKey, props.params, clientHost),
    meta: {
      topics,
      ...(userMeta ?? {}),
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

      globalActionsStore.getState().addAction({
        type: "query",
        name: `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/threads/${props.socialModuleThreadId}/messages`,
        props: { params: props.params },
        result,
        timestamp: Date.now(),
        requestId: createId(),
      });

      return result;
    },

    staleTime: STALE_TIME,
    ...restReactQueryOptions,
  });
}
