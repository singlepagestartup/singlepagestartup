"use client";

import { api } from "@sps/rbac/models/subject/sdk/client";

interface IThreadMessagesScope {
  subjectId: string;
  socialModuleProfileId: string;
  socialModuleChatId: string;
  socialModuleThreadId: string;
}

export function useThreadMessages(
  scope: IThreadMessagesScope,
  refetchInterval: number | false = false,
) {
  return api.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFind({
    id: scope.subjectId,
    socialModuleProfileId: scope.socialModuleProfileId,
    socialModuleChatId: scope.socialModuleChatId,
    socialModuleThreadId: scope.socialModuleThreadId,
    params: {
      orderBy: {
        and: [{ column: "createdAt", method: "asc" }],
      },
    },
    options: {
      headers: { "Cache-Control": "no-store" },
    },
    reactQueryOptions: { refetchInterval },
  });
}
