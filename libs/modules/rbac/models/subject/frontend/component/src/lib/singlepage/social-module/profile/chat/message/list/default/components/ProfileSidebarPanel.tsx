"use client";

import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import type { KnowledgeSource, SocialSkill } from "../types";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";

interface ProfileSidebarPanelProps {
  hasKnowledgeSourcesError: boolean;
  isKnowledgeSourcesLoading: boolean;
  isSkillsLoading: boolean;
  knowledgeSources: KnowledgeSource[];
  language: string;
  onKnowledgeSourceCreate?: (profile: ISocialModuleProfile) => void;
  onKnowledgeSourceSelect: (document: KnowledgeSource) => void;
  onMcpServersEdit?: (profile: ISocialModuleProfile) => void;
  onProfileEdit?: (profile: ISocialModuleProfile) => void;
  onSkillCreate?: (profile: ISocialModuleProfile) => void;
  onSkillEdit?: (skill: SocialSkill) => void;
  onClose?: () => void;
  profile: ISocialModuleProfile | null;
  selectedKnowledgeSource?: KnowledgeSource | null;
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
      knowledgeSources={props.knowledgeSources}
      selectedKnowledgeSource={props.selectedKnowledgeSource}
      isSkillsLoading={props.isSkillsLoading}
      isKnowledgeSourcesLoading={props.isKnowledgeSourcesLoading}
      hasKnowledgeSourcesError={props.hasKnowledgeSourcesError}
      onKnowledgeSourceSelect={props.onKnowledgeSourceSelect}
      onKnowledgeSourceCreate={props.onKnowledgeSourceCreate}
      onMcpServersEdit={props.onMcpServersEdit}
      onProfileEdit={props.onProfileEdit}
      onSkillCreate={props.onSkillCreate}
      onSkillEdit={props.onSkillEdit}
      onClose={props.onClose}
    />
  );
}
