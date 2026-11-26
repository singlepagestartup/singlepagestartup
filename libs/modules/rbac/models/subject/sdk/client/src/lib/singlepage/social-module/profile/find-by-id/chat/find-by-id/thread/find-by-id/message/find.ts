"use client";

import { route, clientHost } from "@sps/rbac/models/subject/sdk/model";
import {
  useQuery,
  UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
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
import type {
  IChatAttachmentIndexEntry,
  TChatThreadReadResult,
} from "@sps/social/models/message/sdk/model";

export type IProps<TData = IResult, IsIndex extends boolean = false> = Omit<
  IParentProps["ISocialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFindProps"],
  "attachmentIndex"
> & {
  attachmentIndex?: IsIndex;
  reactQueryOptions?: Partial<
    UseQueryOptions<TChatThreadReadResult<IsIndex>, Error, TData>
  >;
  mute?: boolean;
};

export type IResult =
  IParentResult["ISocialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFindResult"];

export function action<TData = IResult>(
  props: IProps<TData>,
): UseQueryResult<TData, Error>;
export function action<TData = IChatAttachmentIndexEntry[]>(
  props: IProps<TData, true> & { attachmentIndex: true },
): UseQueryResult<TData, Error>;
export function action<TData>(
  props: IProps<TData> | (IProps<TData, true> & { attachmentIndex: true }),
): UseQueryResult<TData, Error> {
  // The two overloads tie each selector to the exact response of its request.
  return useThreadQuery<TData, boolean>(props as IProps<TData, boolean>);
}

function useThreadQuery<TData, IsIndex extends boolean>(
  props: IProps<TData, IsIndex>,
): UseQueryResult<TData, Error> {
  const queryKey = `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/threads/${props.socialModuleThreadId}/messages`;
  const topics = [
    `social.chats.${props.socialModuleChatId}.threads.${props.socialModuleThreadId}.messages`,
    `social.threads.${props.socialModuleThreadId}.messages`,
    "social.messages",
  ];
  if (props.attachmentIndex || props.params?.attachmentMessageId) {
    topics.push(
      "file-storage.files",
      "social.messages-to-file-storage-module-files",
      "social.threads-to-messages",
      "social.profiles-to-chats",
      "social.chats-to-threads",
    );
  }
  // Merge caller meta last but never let it clobber topics (issue #195): a
  // project passing reactQueryOptions.meta must not silently drop the realtime
  // topic subscription.
  const { meta: userMeta, ...restReactQueryOptions } =
    props.reactQueryOptions ?? {};

  useEffect(() => {
    const unsubscribe = subscription(queryKey, queryClient);
    return unsubscribe;
  }, [queryKey]);

  const params = props.attachmentIndex
    ? { ...props.params, populate: "attachment-index" }
    : props.params;
  return useQuery<TChatThreadReadResult<IsIndex>, Error, TData>({
    queryKey: consistencyQueryKey(queryKey, params, clientHost),
    meta: {
      ...(userMeta ?? {}),
      topics: Array.from(
        new Set([
          ...topics,
          ...(Array.isArray(userMeta?.topics) ? userMeta.topics : []),
        ]),
      ),
      ...(props.attachmentIndex ? { reconcileOnListPatch: true } : {}),
    },
    queryFn: async () => {
      const result =
        await api.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFind<IsIndex>(
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
        props: { params },
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
