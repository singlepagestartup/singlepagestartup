"use client";

import { route } from "@sps/rbac/models/subject/sdk/model";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { queryClient } from "@sps/shared-frontend-client-api";
import type { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { useCallback, useMemo } from "react";
import QueryString from "qs";

interface UseKnowledgeSourcesProps {
  assistantProfile?: ISocialModuleProfile | null;
  socialModuleChat: ISocialModuleChat;
  socialModuleProfileId: string;
  subjectId: string;
}

export function useKnowledgeSources(props: UseKnowledgeSourcesProps) {
  const canUseKnowledge =
    props.assistantProfile?.variant === "artificial-intelligence";
  const knowledgeAssistantProfileId = canUseKnowledge
    ? props.assistantProfile?.id
    : undefined;
  const knowledgeSourceScopeParams = useMemo(() => {
    if (!knowledgeAssistantProfileId) {
      return undefined;
    }

    return {
      targetSocialModuleProfileId: knowledgeAssistantProfileId,
      socialModuleChatId: props.socialModuleChat.id,
    };
  }, [knowledgeAssistantProfileId, props.socialModuleChat.id]);
  const { refetch: refetchKnowledgeSources } =
    api.socialModuleProfileFindByIdKnowledgeSourceFind({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      params: knowledgeSourceScopeParams,
      options: {
        headers: {
          "Cache-Control": "no-store",
        },
      },
      reactQueryOptions: {
        enabled: Boolean(knowledgeAssistantProfileId),
      },
    });
  const knowledgeSourcesQueryKey = useMemo(() => {
    // Mirror the SDK read key exactly (issue #195): the SDK always appends
    // `?${QueryString.stringify(params)}`, so build the invalidation key the
    // same way instead of hand-concatenating params.
    const stringifiedQuery = QueryString.stringify(knowledgeSourceScopeParams, {
      encodeValuesOnly: true,
    });

    return [
      `${route}/${props.subjectId}/social-module/profiles/${props.socialModuleProfileId}/knowledge/sources?${stringifiedQuery}`,
    ];
  }, [
    knowledgeSourceScopeParams,
    props.socialModuleProfileId,
    props.subjectId,
  ]);
  const refetchKnowledgeSourceQueries = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: knowledgeSourcesQueryKey,
    });
    void refetchKnowledgeSources();
  }, [knowledgeSourcesQueryKey, refetchKnowledgeSources]);

  return {
    knowledgeAssistantProfileId,
    refetchKnowledgeSourceQueries,
  };
}
