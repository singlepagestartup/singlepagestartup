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
import { deriveTopicsFromPath, STALE_TIME } from "@sps/shared-utils";
import { useEffect } from "react";

export type IProps =
  IParentProps["ISocialModuleProfileFindByIdChatFindProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<any>>;
    mute?: boolean;
  };

export type IResult =
  IParentResult["ISocialModuleProfileFindByIdChatFindResult"];

export function action(props: IProps) {
  const queryKey = `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats`;
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
    queryKey: [queryKey],
    // Canonical realtime subscription (issue #195): hand-written SDK queries
    // MUST declare meta.topics, otherwise the topic branch in subscription()
    // never matches and the route fallback cannot bridge the differently
    // scoped create route (/social-module/chats) to this read route
    // (/social-module/profiles/{id}/chats) — which is why a newly created chat
    // did not appear in the list until reload. Derived from the same algorithm
    // the backend emitter and factory use, so a chat create/update/delete
    // (topic `social.chats`) invalidates this list.
    meta: {
      topics: deriveTopicsFromPath(queryKey),
      ...(userMeta ?? {}),
    },
    queryFn: async () => {
      const result = await api.socialModuleProfileFindByIdChatFind({
        ...props,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
        host: clientHost,
      });

      return result;
    },
    select(data) {
      globalActionsStore.getState().addAction({
        type: "query",
        name: `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats`,
        props: this,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });

      return data;
    },
    staleTime: STALE_TIME,
    ...restReactQueryOptions,
  });
}
