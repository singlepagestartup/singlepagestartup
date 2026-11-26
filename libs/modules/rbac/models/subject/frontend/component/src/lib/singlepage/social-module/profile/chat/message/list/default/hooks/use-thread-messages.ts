"use client";

import {
  api,
  type IProps as ISdkProps,
  type IResult as ISdkResult,
} from "@sps/rbac/models/subject/sdk/client";

import type { IChatAttachmentIndexEntry } from "@sps/social/models/message/sdk/model";

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
  attachmentMessageId?: string;
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
        ...(query?.attachmentMessageId
          ? { attachmentMessageId: query.attachmentMessageId }
          : {}),
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

export function useThreadAttachmentIndex<TData = IChatAttachmentIndexEntry[]>(
  scope: IThreadMessagesScope,
  enabled: boolean,
  select?: (entries: IChatAttachmentIndexEntry[]) => TData,
) {
  return api.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFind<TData>(
    {
      id: scope.subjectId,
      socialModuleProfileId: scope.socialModuleProfileId,
      socialModuleChatId: scope.socialModuleChatId,
      socialModuleThreadId: scope.socialModuleThreadId,
      attachmentIndex: true,
      options: { headers: { "Cache-Control": "no-store" } },
      reactQueryOptions: { enabled, select },
    },
  );
}
