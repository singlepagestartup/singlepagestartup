"use client";

import { route } from "@sps/rbac/models/subject/sdk/model";
import { queryClient } from "@sps/shared-frontend-client-api";
import { useCallback, useMemo } from "react";

interface UseThreadMessagesRefetchProps {
  socialModuleChatId: string;
  socialModuleProfileId: string;
  socialModuleThreadId: string;
  subjectId: string;
}

export function useThreadMessagesRefetch(props: UseThreadMessagesRefetchProps) {
  const threadMessagesQueryKey = useMemo(() => {
    return [
      `${route}/${props.subjectId}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/threads/${props.socialModuleThreadId}/messages`,
    ];
  }, [
    props.socialModuleChatId,
    props.socialModuleProfileId,
    props.socialModuleThreadId,
    props.subjectId,
  ]);

  return useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: threadMessagesQueryKey,
    });
  }, [threadMessagesQueryKey]);
}
