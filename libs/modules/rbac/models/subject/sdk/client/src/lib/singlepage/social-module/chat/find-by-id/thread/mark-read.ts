"use client";

import { clientHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  api,
  type IProps as ServerProps,
  type IResult as ServerResult,
} from "@sps/rbac/models/subject/sdk/server";
import {
  patchInListQueries,
  queryClient,
} from "@sps/shared-frontend-client-api";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import { useMutation } from "@tanstack/react-query";

type MutationProps =
  ServerProps["ISocialModuleChatFindByIdThreadMarkReadProps"];
export interface IProps {
  id: string;
  socialModuleChatId: string;
  socialModuleThreadId: string;
}

export type IResult =
  ServerResult["ISocialModuleChatFindByIdThreadMarkReadResult"];

export function action(props: IProps) {
  const subjectRoute = `${route}/${props.id}/social-module`;
  const threadListRoute = `${subjectRoute}/chats/${props.socialModuleChatId}/threads`;
  const readRoute = `${threadListRoute}/${props.socialModuleThreadId}/read`;
  return useMutation<IResult, Error, MutationProps>({
    mutationKey: [readRoute],
    scope: { id: threadListRoute },
    mutationFn: (variables) =>
      api.socialModuleChatFindByIdThreadMarkRead({
        ...variables,
        host: clientHost,
        options: {
          ...variables.options,
          headers: saturateHeaders(variables.options?.headers),
        },
      }),
    onSuccess(data) {
      patchInListQueries<{ id: string; unreadCount: number }>(
        queryClient,
        threadListRoute,
        data.threadId,
        { unreadCount: data.unreadCount },
      );
      const chatListRoutes = new Set<string>();
      for (const query of queryClient.getQueryCache().getAll()) {
        const path = query.queryKey[0];
        if (
          typeof path === "string" &&
          path.startsWith(`${subjectRoute}/profiles/`) &&
          path.endsWith("/chats")
        ) {
          chatListRoutes.add(path);
        }
      }
      for (const path of chatListRoutes) {
        patchInListQueries<{ id: string; unreadCount: number }>(
          queryClient,
          path,
          props.socialModuleChatId,
          { unreadCount: data.chatUnreadCount },
        );
      }
    },
  });
}
