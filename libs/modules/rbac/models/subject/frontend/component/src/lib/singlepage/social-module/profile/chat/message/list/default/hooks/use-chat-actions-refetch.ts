"use client";

import { route } from "@sps/rbac/models/subject/sdk/model";
import { queryClient } from "@sps/shared-frontend-client-api";
import { useCallback, useMemo } from "react";

interface UseChatActionsRefetchProps {
  socialModuleChatId: string;
  socialModuleProfileId: string;
  subjectId: string;
}

/**
 * Immediate-feedback invalidation for the chat ACTIONS query (issue #195).
 *
 * The AI reaction (reactByOpenrouter) is an RPC verb whose server-derived
 * topics do not match the actions query's topics, so action rows created by
 * the reaction do not appear until reload. This hook invalidates the actions
 * query by its route PREFIX (ignoring the serialized `?params` suffix) so the
 * exact orderBy/threadId params never need to be reconstructed. WS topic
 * invalidation remains the background consistency fallback.
 */
export function useChatActionsRefetch(props: UseChatActionsRefetchProps) {
  const actionsRoutePrefix = useMemo(() => {
    return `${route}/${props.subjectId}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/actions`;
  }, [props.socialModuleChatId, props.socialModuleProfileId, props.subjectId]);

  return useCallback(() => {
    void queryClient.invalidateQueries({
      predicate: (query) => {
        const firstKey = query.queryKey?.[0];

        if (typeof firstKey !== "string") {
          return false;
        }

        return firstKey.split("?")[0] === actionsRoutePrefix;
      },
    });
  }, [actionsRoutePrefix]);
}
