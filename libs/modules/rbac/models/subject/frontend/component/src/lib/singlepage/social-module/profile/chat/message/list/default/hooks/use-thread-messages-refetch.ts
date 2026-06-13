"use client";

import { route } from "@sps/rbac/models/subject/sdk/model";
import {
  appendToListQueries,
  patchInListQueries,
  queryClient,
  removeFromListQueries,
} from "@sps/shared-frontend-client-api";
import type { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import { useMemo } from "react";

interface UseThreadMessagesRefetchProps {
  socialModuleChatId: string;
  socialModuleProfileId: string;
  socialModuleThreadId: string;
  subjectId: string;
}

export interface ThreadMessagesCache {
  /** Full invalidation - kept for server-created data (AI replies) and error recovery. */
  refetch: () => void;
  /** Appends a created message in place (exact-key mode, no refetch). */
  append: (message: ISocialModuleMessage) => void;
  /** Patches one message in place by id. */
  patch: (id: string, patch: Partial<ISocialModuleMessage>) => void;
  /** Removes one message in place by id. */
  remove: (id: string) => void;
}

/**
 * Targeted cache API for the thread messages query.
 *
 * The chat find query is thread-scoped while message update/delete mutations
 * are chat-scoped - their route prefixes do not align, so the generic factory
 * automation cannot cover chat. This hook owns the explicit one-element
 * thread-message query key and exposes append/patch/remove built on the
 * shared cache helpers, with refetch as the consistency fallback.
 */
export function useThreadMessagesRefetch(
  props: UseThreadMessagesRefetchProps,
): ThreadMessagesCache {
  const threadMessagesUrl = useMemo(() => {
    return `${route}/${props.subjectId}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/threads/${props.socialModuleThreadId}/messages`;
  }, [
    props.socialModuleChatId,
    props.socialModuleProfileId,
    props.socialModuleThreadId,
    props.subjectId,
  ]);

  return useMemo(() => {
    return {
      refetch: () => {
        void queryClient.invalidateQueries({
          queryKey: [threadMessagesUrl],
        });
      },
      append: (message) => {
        appendToListQueries(queryClient, threadMessagesUrl, message, {
          exact: true,
        });
      },
      patch: (id, patch) => {
        patchInListQueries(queryClient, threadMessagesUrl, id, patch);
      },
      remove: (id) => {
        removeFromListQueries(queryClient, threadMessagesUrl, id);
      },
    };
  }, [threadMessagesUrl]);
}
