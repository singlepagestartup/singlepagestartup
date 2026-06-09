"use client";

import { route } from "@sps/rbac/models/subject/sdk/model";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { queryClient } from "@sps/shared-frontend-client-api";
import type { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { useCallback, useMemo } from "react";

interface UseKnowledgeDocumentsProps {
  knowledgeAssistantProfile?: ISocialModuleProfile | null;
  socialModuleChat: ISocialModuleChat;
  socialModuleProfileId: string;
  subjectId: string;
}

export function useKnowledgeDocuments(props: UseKnowledgeDocumentsProps) {
  const isKnowledgeChat = props.socialModuleChat.variant === "knowledge";
  const knowledgeAssistantProfileId = isKnowledgeChat
    ? props.knowledgeAssistantProfile?.id
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
    const scope = knowledgeDocumentScopeParams
      ? `?targetSocialModuleProfileId=${knowledgeDocumentScopeParams.targetSocialModuleProfileId}&socialModuleChatId=${knowledgeDocumentScopeParams.socialModuleChatId}`
      : "";

    return [
      `${route}/${props.subjectId}/social-module/profiles/${props.socialModuleProfileId}/knowledge/documents${scope}`,
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
    isKnowledgeChat,
    knowledgeAssistantProfileId,
    knowledgeDocumentScopeParams,
    refetchKnowledgeDocumentQueries,
  };
}
