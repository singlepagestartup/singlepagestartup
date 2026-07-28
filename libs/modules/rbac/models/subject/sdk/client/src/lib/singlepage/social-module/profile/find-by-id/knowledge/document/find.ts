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
import {
  defaultCompiledTopicRules,
  resolveTopicsForPath,
  STALE_TIME,
} from "@sps/shared-utils";
import { useEffect } from "react";
import QueryString from "qs";

export type IProps =
  IParentProps["ISocialModuleProfileFindByIdKnowledgeDocumentFindProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<any>>;
    mute?: boolean;
  };

export type IResult =
  IParentResult["ISocialModuleProfileFindByIdKnowledgeDocumentFindResult"];

export function action(props: IProps) {
  const stringifiedQuery = QueryString.stringify(props.params, {
    encodeValuesOnly: true,
  });
  const queryKey = `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/knowledge/documents?${stringifiedQuery}`;
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
    // This RBAC endpoint is a composite read over a Social relation and
    // Knowledge documents. Resolve the framework rule instead of deriving the
    // misleading literal `social.documents` topic from its URL suffix.
    meta: {
      topics: resolveTopicsForPath(queryKey, defaultCompiledTopicRules),
      ...(userMeta ?? {}),
    },
    queryFn: async () => {
      const result = await api.socialModuleProfileFindByIdKnowledgeDocumentFind(
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
    ...restReactQueryOptions,
  });
}
