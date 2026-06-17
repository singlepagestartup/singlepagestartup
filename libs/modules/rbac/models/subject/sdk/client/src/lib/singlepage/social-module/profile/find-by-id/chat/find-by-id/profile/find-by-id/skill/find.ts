"use client";

import { route, clientHost } from "@sps/rbac/models/subject/sdk/model";
import { useEffect } from "react";
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

export type IProps =
  IParentProps["ISocialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFindProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<any>>;
  };

export type IResult =
  IParentResult["ISocialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFindResult"];

export function action(props: IProps) {
  const queryKey = `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/profiles/${props.targetSocialModuleProfileId}/skills`;
  const { meta: userMeta, ...restReactQueryOptions } =
    props.reactQueryOptions ?? {};

  useEffect(() => {
    const unsubscribe = subscription(queryKey, queryClient);
    return unsubscribe;
  }, [queryKey]);

  return useQuery<IResult>({
    queryKey: [queryKey],
    meta: {
      topics: deriveTopicsFromPath(queryKey),
      ...(userMeta ?? {}),
    },
    queryFn: async () => {
      const result =
        await api.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFind(
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
