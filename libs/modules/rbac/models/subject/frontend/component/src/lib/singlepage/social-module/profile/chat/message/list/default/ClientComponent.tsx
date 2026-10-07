"use client";

import { Composer } from "./components/Composer";
import { KnowledgeSourceDialog } from "./components/KnowledgeSourceDialog";
import { McpServersDialog } from "./components/McpServersDialog";
import { MessageTimelineSection } from "./components/MessageTimelineSection";
import { ProfileEditDialog } from "./components/ProfileEditDialog";
import { ProfileSidebarPanel } from "./components/ProfileSidebarPanel";
import { ProfileSidebarSheet } from "./components/ProfileSidebarSheet";
import { useKnowledgeSources } from "./hooks/use-knowledge-sources";
import { useOpenRouterModelControls } from "./hooks/use-openrouter-model-controls";
import { useProfileSidebar } from "./hooks/use-profile-sidebar";
import { useProfileSkills } from "./hooks/use-profile-skills";
import { useThreadMessagesRefetch } from "./hooks/use-thread-messages-refetch";
import { IComponentPropsExtended } from "./interface";
import type { KnowledgeSource, SocialSkill } from "./types";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SocialModuleSkillChatCreateDialog } from "@sps/social/models/skill/frontend/component/src/lib/singlepage/chat-create-dialog";
import { useCallback, useRef, useState } from "react";
import type { IModel as SocialProfile } from "@sps/social/models/profile/sdk/model";

interface SkillDialogTarget {
  orderIndex: number;
  profileId: string;
}

/**
 * Chat shell (issue #195): renders the sidebar, dialogs, and the two isolated
 * boundaries — MessageTimelineSection (owns the message/action queries and
 * scroll) and Composer (owns the form and mutations). The shell receives NO
 * message arrays as props and holds no per-message pending state, so sending,
 * editing, deleting, AI refetches, and WS invalidation never rerender it.
 * Cross-boundary communication goes through stable callback refs and the
 * ThreadMessagesCache API.
 */
export function Component(props: IComponentPropsExtended) {
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [isMcpServersDialogOpen, setIsMcpServersDialogOpen] = useState(false);
  const [isProfileEditDialogOpen, setIsProfileEditDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SocialSkill | null>(null);
  const [skillDialogTarget, setSkillDialogTarget] =
    useState<SkillDialogTarget | null>(null);
  const focusComposerTextAreaRef = useRef<() => void>(() => {});
  const markShouldScrollToBottomRef = useRef<() => void>(() => {});

  const registerFocusComposerTextArea = useCallback((focus: () => void) => {
    focusComposerTextAreaRef.current = focus;
  }, []);
  const markShouldScrollToBottom = useCallback(() => {
    markShouldScrollToBottomRef.current();
  }, []);

  const threadMessagesCache = useThreadMessagesRefetch({
    subjectId: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    socialModuleChatId: props.socialModuleChat.id,
    socialModuleThreadId: props.socialModuleThreadId,
  });
  const assistantProfile =
    props.knowledgeAssistantProfile ||
    props.artificialIntelligenceOpponentProfile ||
    null;
  // Single source of truth: OpenRouter controls, knowledge access, and the
  // AI-opponent layout all gate on the same condition (issue #195 cleanup).
  const isArtificialIntelligenceAssistant =
    assistantProfile?.variant === "artificial-intelligence";
  const knowledgeSources = useKnowledgeSources({
    subjectId: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    socialModuleChat: props.socialModuleChat,
    assistantProfile,
  });
  const profileSidebar = useProfileSidebar({
    subjectId: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    socialModuleChatId: props.socialModuleChat.id,
  });
  const composerSkillsProfileId =
    knowledgeSources.knowledgeAssistantProfileId || "missing-profile";
  const profileSkills = useProfileSkills({
    enabled: isArtificialIntelligenceAssistant,
    subjectId: props.data.id,
    requesterSocialModuleProfileId: props.socialModuleProfile.id,
    socialModuleChatId: props.socialModuleChat.id,
    socialModuleProfileId: composerSkillsProfileId,
    onSkillSaved() {
      focusComposerTextAreaRef.current();
      profileSidebar.refetchSkillQueries();
    },
  });
  const openRouterModelControls = useOpenRouterModelControls({
    subjectId: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    socialModuleChatId: props.socialModuleChat.id,
    socialModuleThread: props.socialModuleThread,
    socialModuleThreadId: props.socialModuleThreadId,
    enabled: isArtificialIntelligenceAssistant,
  });

  function openSidebarSkillCreateDialog(profile: SocialProfile) {
    setEditingSkill(null);
    profileSidebar.setIsMobileSheetOpen(false);
    setSkillDialogTarget({
      orderIndex: profileSidebar.profileSkillIds.length,
      profileId: profile.id,
    });
    setIsSkillDialogOpen(true);
  }

  function openSidebarKnowledgeSourceCreateDialog(profile: SocialProfile) {
    profileSidebar.setIsMobileSheetOpen(false);
    profileSidebar.onKnowledgeSourceCreate(profile);
  }

  function openProfileEditDialog() {
    profileSidebar.setIsMobileSheetOpen(false);
    setIsProfileEditDialogOpen(true);
  }

  function openMcpServersDialog() {
    profileSidebar.setIsMobileSheetOpen(false);
    setIsMcpServersDialogOpen(true);
  }

  function openKnowledgeSourceEditDialog(document: KnowledgeSource) {
    profileSidebar.setIsMobileSheetOpen(false);
    profileSidebar.onKnowledgeSourceSelect(document);
  }

  function openSkillEditDialog(skill: SocialSkill) {
    setEditingSkill(skill);
    profileSidebar.setIsMobileSheetOpen(false);
    setSkillDialogTarget({
      orderIndex: profileSkills.profileSkillIds.length,
      profileId: profileSidebar.selectedProfile?.id || composerSkillsProfileId,
    });
    setIsSkillDialogOpen(true);
  }

  const fallbackSkillDialogTarget = {
    orderIndex: profileSkills.profileSkillIds.length,
    profileId: composerSkillsProfileId,
  };
  const resolvedSkillDialogTarget =
    skillDialogTarget || fallbackSkillDialogTarget;

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden bg-white",
        props.className,
      )}
    >
      <ProfileSidebarSheet
        isOpen={profileSidebar.isMobileSheetOpen}
        onOpenChange={(open) => {
          if (open) {
            profileSidebar.setIsMobileSheetOpen(true);
            return;
          }

          profileSidebar.closeProfile();
        }}
      >
        <ProfileSidebarPanel
          hasKnowledgeSourcesError={profileSidebar.hasKnowledgeSourcesError}
          isKnowledgeSourcesLoading={profileSidebar.isKnowledgeSourcesLoading}
          isSkillsLoading={profileSidebar.isSkillsLoading}
          knowledgeSources={profileSidebar.knowledgeSources}
          language={props.language}
          onKnowledgeSourceCreate={
            profileSidebar.canManageSelectedProfile
              ? openSidebarKnowledgeSourceCreateDialog
              : undefined
          }
          onKnowledgeSourceSelect={openKnowledgeSourceEditDialog}
          onMcpServersEdit={
            profileSidebar.canManageSelectedProfile
              ? openMcpServersDialog
              : undefined
          }
          onProfileEdit={
            profileSidebar.canManageSelectedProfile
              ? openProfileEditDialog
              : undefined
          }
          onSkillCreate={
            profileSidebar.canManageSelectedProfile
              ? openSidebarSkillCreateDialog
              : undefined
          }
          onSkillEdit={
            profileSidebar.canManageSelectedProfile
              ? openSkillEditDialog
              : undefined
          }
          profile={profileSidebar.selectedProfile}
          selectedKnowledgeSource={profileSidebar.selectedKnowledgeSource}
          skills={profileSidebar.skills}
        />
      </ProfileSidebarSheet>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <MessageTimelineSection
            language={props.language}
            markShouldScrollToBottomRef={markShouldScrollToBottomRef}
            onProfileOpen={profileSidebar.openProfile}
            socialModuleChatId={props.socialModuleChat.id}
            socialModuleProfileId={props.socialModuleProfile.id}
            socialModuleThreadId={props.socialModuleThreadId}
            subjectId={props.data.id}
            threadMessagesCache={threadMessagesCache}
          />
          <SocialModuleSkillChatCreateDialog
            isServer={false}
            variant="chat-create-dialog"
            language={props.language}
            data={editingSkill}
            mode={editingSkill ? "edit" : "create"}
            open={isSkillDialogOpen}
            onOpenChange={(open) => {
              setIsSkillDialogOpen(open);

              if (!open) {
                setEditingSkill(null);
                setSkillDialogTarget(null);
              }
            }}
            profileId={resolvedSkillDialogTarget.profileId}
            orderIndex={resolvedSkillDialogTarget.orderIndex}
            isSubmitting={
              profileSkills.isCreatingSkill || profileSkills.isUpdatingSkill
            }
            onCreate={profileSkills.createSkillAndLinkToProfile}
            onUpdate={(skill, values) => {
              return profileSkills.updateProfileSkill(
                skill,
                values,
                resolvedSkillDialogTarget.profileId,
              );
            }}
          />
          <KnowledgeSourceDialog
            fileScope={
              profileSidebar.selectedProfile &&
              profileSidebar.selectedKnowledgeSource
                ? {
                    id: props.data.id,
                    socialModuleProfileId: props.socialModuleProfile.id,
                    socialModuleChatId: props.socialModuleChat.id,
                    targetSocialModuleProfileId:
                      profileSidebar.selectedProfile.id,
                    knowledgeModuleSourceId:
                      profileSidebar.selectedKnowledgeSource.id,
                  }
                : undefined
            }
            onFilesUpdated={profileSidebar.onKnowledgeSourceSelect}
            document={profileSidebar.selectedKnowledgeSource}
            draft={profileSidebar.knowledgeSourceDraft}
            isDeleting={profileSidebar.isDeletingKnowledgeSource}
            isDirty={profileSidebar.isKnowledgeSourceDirty}
            isOpen={Boolean(profileSidebar.selectedKnowledgeSource)}
            isReindexing={profileSidebar.isReindexingKnowledgeSource}
            isSaving={profileSidebar.isSavingKnowledgeSource}
            language={props.language}
            mode={profileSidebar.isCreatingKnowledgeSource ? "create" : "edit"}
            needsReindex={profileSidebar.selectedKnowledgeSourceNeedsReindex}
            onDelete={profileSidebar.onKnowledgeSourceDelete}
            onUnlink={profileSidebar.onKnowledgeSourceUnlink}
            onDraftChange={profileSidebar.onKnowledgeSourceDraftChange}
            onOpenChange={(open) => {
              if (!open) {
                profileSidebar.closeKnowledgeSource();
              }
            }}
            onReindex={profileSidebar.onKnowledgeSourceReindex}
            onSave={profileSidebar.onKnowledgeSourceSave}
          />
          <McpServersDialog
            isOpen={isMcpServersDialogOpen}
            isSaving={profileSidebar.isSavingProfile}
            onOpenChange={setIsMcpServersDialogOpen}
            onSave={(allowedMcpServerIds) => {
              void profileSidebar
                .onProfileSave({ allowedMcpServerIds })
                .then(() => {
                  setIsMcpServersDialogOpen(false);
                });
            }}
            profile={profileSidebar.selectedProfile}
          />
          <ProfileEditDialog
            isOpen={isProfileEditDialogOpen}
            isSaving={profileSidebar.isSavingProfile}
            language={props.language}
            onOpenChange={setIsProfileEditDialogOpen}
            onSave={(values) => {
              profileSidebar.onProfileSave(values);
              setIsProfileEditDialogOpen(false);
            }}
            profile={profileSidebar.selectedProfile}
          />
          <Composer
            canSelectOpenRouterReasoning={
              openRouterModelControls.canSelectReasoning
            }
            canUseKnowledge={isArtificialIntelligenceAssistant}
            clearSelectedSkills={profileSkills.clearSelectedSkills}
            isArtificialIntelligenceOpponent={isArtificialIntelligenceAssistant}
            isOpenRouterModelsLoading={openRouterModelControls.isLoadingModels}
            isOpenRouterModelFavoritesUpdating={
              openRouterModelControls.isUpdatingFavoriteModels
            }
            isSkillOptionsLoading={profileSkills.isLoadingSkills}
            language={props.language}
            markShouldScrollToBottom={markShouldScrollToBottom}
            onOpenRouterModelChange={openRouterModelControls.setSelectedModelId}
            onOpenRouterReasoningChange={
              openRouterModelControls.setSelectedReasoning
            }
            onOpenRouterModelFavoriteToggle={
              openRouterModelControls.toggleFavoriteModelId
            }
            onRemoveSelectedSkill={profileSkills.removeSelectedSkill}
            onSkillSelect={profileSkills.selectSkill}
            openRouterFavoriteModelIds={
              openRouterModelControls.favoriteModelIds
            }
            openRouterModelGroups={openRouterModelControls.modelGroups}
            openRouterModelId={openRouterModelControls.selectedModelId}
            openRouterModelLabel={openRouterModelControls.selectedModelLabel}
            openRouterReasoning={openRouterModelControls.selectedReasoning}
            openRouterReasoningLabel={
              openRouterModelControls.selectedReasoningLabel
            }
            openRouterReasoningOptions={
              openRouterModelControls.reasoningOptions
            }
            profileSkills={profileSkills.profileSkills}
            registerFocusComposerTextArea={registerFocusComposerTextArea}
            selectedSkillIds={profileSkills.selectedSkillIds}
            selectedSkills={profileSkills.selectedSkills}
            showOpenRouterControls={isArtificialIntelligenceAssistant}
            socialModuleChatId={props.socialModuleChat.id}
            socialModuleProfileId={props.socialModuleProfile.id}
            socialModuleThreadId={props.socialModuleThreadId}
            subjectId={props.data.id}
            syncSelectedSkillsToDescription={
              profileSkills.syncSelectedSkillsToDescription
            }
            threadMessagesCache={threadMessagesCache}
          />
        </div>
        {profileSidebar.isSidebarOpen &&
        profileSidebar.selectedProfile &&
        !profileSidebar.isMobileSheetOpen ? (
          <aside className="hidden min-h-0 w-96 shrink-0 border-l border-slate-200 2xl:block">
            <ProfileSidebarPanel
              hasKnowledgeSourcesError={profileSidebar.hasKnowledgeSourcesError}
              isKnowledgeSourcesLoading={
                profileSidebar.isKnowledgeSourcesLoading
              }
              isSkillsLoading={profileSidebar.isSkillsLoading}
              knowledgeSources={profileSidebar.knowledgeSources}
              language={props.language}
              onKnowledgeSourceCreate={
                profileSidebar.canManageSelectedProfile
                  ? openSidebarKnowledgeSourceCreateDialog
                  : undefined
              }
              onKnowledgeSourceSelect={openKnowledgeSourceEditDialog}
              onMcpServersEdit={
                profileSidebar.canManageSelectedProfile
                  ? openMcpServersDialog
                  : undefined
              }
              onProfileEdit={
                profileSidebar.canManageSelectedProfile
                  ? openProfileEditDialog
                  : undefined
              }
              onSkillCreate={
                profileSidebar.canManageSelectedProfile
                  ? openSidebarSkillCreateDialog
                  : undefined
              }
              onSkillEdit={
                profileSidebar.canManageSelectedProfile
                  ? openSkillEditDialog
                  : undefined
              }
              onClose={profileSidebar.closeProfile}
              profile={profileSidebar.selectedProfile}
              selectedKnowledgeSource={profileSidebar.selectedKnowledgeSource}
              skills={profileSidebar.skills}
            />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
