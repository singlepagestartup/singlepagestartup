"use client";

import {
  api,
  type IProps as ISdkProps,
  type IResult as ISdkResult,
} from "@sps/rbac/models/subject/sdk/client";

export interface IThreadMessagesScope {
  subjectId: string;
  socialModuleProfileId: string;
  socialModuleChatId: string;
  socialModuleThreadId: string;
}

type ThreadMessagesRequest =
  ISdkProps["ISocialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFindProps"];
type ThreadMessages =
  ISdkResult["ISocialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFindResult"];

interface IThreadMessagesOptions<TData> {
  options?: ThreadMessagesRequest["options"];
  select?: (messages: ThreadMessages) => TData;
  enabled?: boolean;
}

export function useThreadMessages<TData = ThreadMessages>(
  scope: IThreadMessagesScope,
  refetchInterval: number | false = false,
  query?: IThreadMessagesOptions<TData>,
) {
  return api.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFind<TData>(
    {
      id: scope.subjectId,
      socialModuleProfileId: scope.socialModuleProfileId,
      socialModuleChatId: scope.socialModuleChatId,
      socialModuleThreadId: scope.socialModuleThreadId,
      params: {
        orderBy: {
          and: [{ column: "createdAt", method: "asc" }],
        },
      },
      options: query?.options ?? { headers: { "Cache-Control": "no-store" } },
      reactQueryOptions: {
        refetchInterval,
        select: query?.select,
        enabled: query?.enabled,
      },
    },
  );
}
