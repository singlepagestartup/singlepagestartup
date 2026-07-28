"use client";

import { route } from "@sps/rbac/models/subject/sdk/model";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { queryClient } from "@sps/shared-frontend-client-api";
import type { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { useCallback, useMemo } from "react";
import QueryString from "qs";

interface UseKnowledgeDocumentsProps {
  assistantProfile?: ISocialModuleProfile | null;
  socialModuleChat: ISocialModuleChat;
  socialModuleProfileId: string;
  subjectId: string;
}

export function useKnowledgeDocuments(props: UseKnowledgeDocumentsProps) {
  const canUseKnowledge =
    props.assistantProfile?.variant === "artificial-intelligence";
  const knowledgeAssistantProfileId = canUseKnowledge
    ? props.assistantProfile?.id
    : undefined;
  const knowledgeDocumentScopeParams = useMemo(() => {
    if (!knowledgeAssistantProfileId) {
      return undefined;
    }

    return {
      targetSocialModuleProfileId: knowledgeAssistantProfileId,
      socialModuleChatId: props.socialModuleChat.id,
    };
  }, [knowledgeAssistantProfileId, props.socialModuleChat.id]);
  const { refetch: refetchKnowledgeDocuments } =
    api.socialModuleProfileFindByIdKnowledgeDocumentFind({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      params: knowledgeDocumentScopeParams,
      options: {
        headers: {
          "Cache-Control": "no-store",
        },
      },
      reactQueryOptions: {
        enabled: Boolean(knowledgeAssistantProfileId),
      },
    });
  const knowledgeDocumentsQueryKey = useMemo(() => {
    // Mirror the SDK read key exactly (issue #195): the SDK always appends
    // `?${QueryString.stringify(params)}`, so build the invalidation key the
    // same way instead of hand-concatenating params.
    const stringifiedQuery = QueryString.stringify(
      knowledgeDocumentScopeParams,
      {
        encodeValuesOnly: true,
      },
    );

    return [
      `${route}/${props.subjectId}/social-module/profiles/${props.socialModuleProfileId}/knowledge/documents?${stringifiedQuery}`,
    ];
  }, [
    knowledgeDocumentScopeParams,
    props.socialModuleProfileId,
    props.subjectId,
  ]);
  const refetchKnowledgeDocumentQueries = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: knowledgeDocumentsQueryKey,
    });
    void refetchKnowledgeDocuments();
  }, [knowledgeDocumentsQueryKey, refetchKnowledgeDocuments]);

  return {
    knowledgeAssistantProfileId,
    refetchKnowledgeDocumentQueries,
  };
}
