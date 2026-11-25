"use client";

import { route, clientHost } from "@sps/rbac/models/subject/sdk/model";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
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
import { STALE_TIME, deriveTopicsFromPath } from "@sps/shared-utils";
import { useEffect } from "react";

export type IProps =
  IParentProps["ISocialModuleProfileFindByIdChatFindByIdProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<any>>;
    mute?: boolean;
  };

export type IResult =
  IParentResult["ISocialModuleProfileFindByIdChatFindByIdResult"];

export function action(props: IProps) {
  const queryKey = `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}`;
  const topics = [
    ...deriveTopicsFromPath(queryKey),
    "rbac.subjects-to-ecommerce-module-stores",
    "rbac.subjects-to-crm-module-tasks",
    "rbac.subjects-to-roles",
    "rbac.subjects-to-social-module-profiles",
    "rbac.subjects-to-social-module-chats",
    "social.profiles-to-chats",
    "social.chats-to-crm-module-tasks",
    "social.chats-to-threads",
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
      ...(userMeta ?? {}),
      topics: Array.from(
        new Set([
          ...topics,
          ...(Array.isArray(userMeta?.topics) ? userMeta.topics : []),
        ]),
      ),
    },
    queryFn: async () => {
      const result = await api.socialModuleProfileFindByIdChatFindById({
        ...props,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
        host: clientHost,
      });

      return result;
    },
    staleTime: STALE_TIME,
    ...restReactQueryOptions,
  });
}
