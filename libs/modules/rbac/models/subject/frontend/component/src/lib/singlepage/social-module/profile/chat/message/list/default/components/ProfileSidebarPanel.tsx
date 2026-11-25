"use client";

import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import type { KnowledgeSource, SocialSkill } from "../types";
import type {
  IModel as ISocialModuleProfile,
  IProfileAvatar,
} from "@sps/social/models/profile/sdk/model";

interface ProfileSidebarPanelProps {
  avatar?: IProfileAvatar | null;
  displayName?: string;
  hasKnowledgeSourcesError?: boolean;
  isKnowledgeSourcesLoading?: boolean;
  isSkillsLoading?: boolean;
  knowledgeSources?: KnowledgeSource[];
  language: string;
  onKnowledgeSourceCreate?: (profile: ISocialModuleProfile) => void;
  onKnowledgeSourceSelect?: (document: KnowledgeSource) => void;
  onMcpServersEdit?: (profile: ISocialModuleProfile) => void;
  onProfileEdit?: (profile: ISocialModuleProfile) => void;
  onSkillCreate?: (profile: ISocialModuleProfile) => void;
  onSkillEdit?: (skill: SocialSkill) => void;
  profile: ISocialModuleProfile | null;
  profileCaption?: string;
  selectedKnowledgeSource?: KnowledgeSource | null;
  skills?: SocialSkill[];
  summaryOnly?: boolean;
}

export function ProfileSidebarPanel(props: ProfileSidebarPanelProps) {
  if (!props.profile) {
    return null;
  }

  return (
    <SocialModuleProfile
      isServer={false}
      variant="chat-profile-sidebar"
      dataSource="props"
      data={props.profile}
      avatar={props.avatar}
      displayName={props.displayName}
      profileCaption={props.profileCaption}
      summaryOnly={props.summaryOnly}
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
    />
  );
}
