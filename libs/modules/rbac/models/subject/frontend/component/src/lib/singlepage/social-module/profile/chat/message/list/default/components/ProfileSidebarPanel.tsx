"use client";

import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import type { KnowledgeDocument, SocialSkill } from "../types";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";

interface ProfileSidebarPanelProps {
  isKnowledgeDocumentsLoading: boolean;
  isSkillsLoading: boolean;
  knowledgeDocuments: KnowledgeDocument[];
  language: string;
  onKnowledgeDocumentCreate?: (profile: ISocialModuleProfile) => void;
  onKnowledgeDocumentSelect: (document: KnowledgeDocument) => void;
  onSkillCreate: (profile: ISocialModuleProfile) => void;
  onSkillEdit: (skill: SocialSkill) => void;
  onClose?: () => void;
  profile: ISocialModuleProfile | null;
  selectedKnowledgeDocument?: KnowledgeDocument | null;
  skills: SocialSkill[];
}

export function ProfileSidebarPanel(props: ProfileSidebarPanelProps) {
  if (!props.profile) {
    return null;
  }

  return (
    <SocialModuleProfile
      isServer={false}
      variant="chat-profile-sidebar"
      data={props.profile}
      language={props.language}
      skills={props.skills}
      knowledgeDocuments={props.knowledgeDocuments}
      selectedKnowledgeDocument={props.selectedKnowledgeDocument}
      isSkillsLoading={props.isSkillsLoading}
      isKnowledgeDocumentsLoading={props.isKnowledgeDocumentsLoading}
      onKnowledgeDocumentSelect={props.onKnowledgeDocumentSelect}
      onKnowledgeDocumentCreate={props.onKnowledgeDocumentCreate}
      onSkillCreate={props.onSkillCreate}
      onSkillEdit={props.onSkillEdit}
      onClose={props.onClose}
    />
  );
}
