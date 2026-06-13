"use client";

import { Composer } from "./components/Composer";
import { KnowledgeDocumentDialog } from "./components/KnowledgeDocumentDialog";
import { MessageTimelineSection } from "./components/MessageTimelineSection";
import { ProfileSidebarPanel } from "./components/ProfileSidebarPanel";
import { ProfileSidebarSheet } from "./components/ProfileSidebarSheet";
import { useChatActionsRefetch } from "./hooks/use-chat-actions-refetch";
import { useKnowledgeDocuments } from "./hooks/use-knowledge-documents";
import { useOpenRouterModelControls } from "./hooks/use-openrouter-model-controls";
import { useProfileSidebar } from "./hooks/use-profile-sidebar";
import { useProfileSkills } from "./hooks/use-profile-skills";
import { useThreadMessagesRefetch } from "./hooks/use-thread-messages-refetch";
import { IComponentPropsExtended } from "./interface";
import type { KnowledgeDocument, SocialSkill } from "./types";
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
  const knowledgeDocuments = useKnowledgeDocuments({
    subjectId: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    socialModuleChat: props.socialModuleChat,
    assistantProfile,
  });
  const profileSidebar = useProfileSidebar({
    subjectId: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    socialModuleChatId: props.socialModuleChat.id,
    canUseKnowledge: isArtificialIntelligenceAssistant,
  });
  const refetchChatActions = useChatActionsRefetch({
    subjectId: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    socialModuleChatId: props.socialModuleChat.id,
  });
  const composerSkillsProfileId =
    knowledgeDocuments.knowledgeAssistantProfileId ||
    props.socialModuleProfile.id;
  const profileSkills = useProfileSkills({
    socialModuleProfileId: composerSkillsProfileId,
    onSkillSaved() {
      focusComposerTextAreaRef.current();
    },
  });
  const openRouterModelControls = useOpenRouterModelControls({
    subjectId: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    socialModuleChatId: props.socialModuleChat.id,
    socialModuleThreadId: props.socialModuleThreadId,
    enabled: isArtificialIntelligenceAssistant,
  });

  const onKnowledgeReactionSuccess = useCallback(() => {
    knowledgeDocuments.refetchKnowledgeDocumentQueries();
    profileSidebar.refetchKnowledgeDocumentQueries();
    // Immediate feedback (issue #195): the AI reaction creates chat ACTION
    // rows whose RPC-derived topics do not match the actions query, so refresh
    // it here so the rows appear without a reload. WS invalidation stays as the
    // background fallback.
    refetchChatActions();
  }, [
    knowledgeDocuments.refetchKnowledgeDocumentQueries,
    profileSidebar.refetchKnowledgeDocumentQueries,
    refetchChatActions,
  ]);

  function openSidebarSkillCreateDialog(profile: SocialProfile) {
    setEditingSkill(null);
    profileSidebar.setIsMobileSheetOpen(false);
    setSkillDialogTarget({
      orderIndex: profileSidebar.profileSkillIds.length,
      profileId: profile.id,
    });
    setIsSkillDialogOpen(true);
  }

  function openSidebarKnowledgeDocumentCreateDialog(profile: SocialProfile) {
    profileSidebar.setIsMobileSheetOpen(false);
    profileSidebar.onKnowledgeDocumentCreate(profile);
  }

  function openKnowledgeDocumentEditDialog(document: KnowledgeDocument) {
    profileSidebar.setIsMobileSheetOpen(false);
    profileSidebar.onKnowledgeDocumentSelect(document);
  }

  function openSkillEditDialog(skill: SocialSkill) {
    setEditingSkill(skill);
    profileSidebar.setIsMobileSheetOpen(false);
    setSkillDialogTarget({
      orderIndex: profileSkills.profileSkillIds.length,
      profileId: composerSkillsProfileId,
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
          isKnowledgeDocumentsLoading={
            profileSidebar.isKnowledgeDocumentsLoading
          }
          isSkillsLoading={profileSidebar.isSkillsLoading}
          knowledgeDocuments={profileSidebar.knowledgeDocuments}
          language={props.language}
          onKnowledgeDocumentCreate={
            isArtificialIntelligenceAssistant
              ? openSidebarKnowledgeDocumentCreateDialog
              : undefined
          }
          onKnowledgeDocumentSelect={openKnowledgeDocumentEditDialog}
          onSkillCreate={openSidebarSkillCreateDialog}
          onSkillEdit={openSkillEditDialog}
          profile={profileSidebar.selectedProfile}
          selectedKnowledgeDocument={profileSidebar.selectedKnowledgeDocument}
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
            onUpdate={profileSkills.updateProfileSkill}
          />
          <KnowledgeDocumentDialog
            document={profileSidebar.selectedKnowledgeDocument}
            draft={profileSidebar.knowledgeDocumentDraft}
            isDeleting={profileSidebar.isDeletingKnowledgeDocument}
            isDirty={profileSidebar.isKnowledgeDocumentDirty}
            isOpen={Boolean(profileSidebar.selectedKnowledgeDocument)}
            isReindexing={profileSidebar.isReindexingKnowledgeDocument}
            isSaving={profileSidebar.isSavingKnowledgeDocument}
            language={props.language}
            mode={
              profileSidebar.isCreatingKnowledgeDocument ? "create" : "edit"
            }
            needsReindex={profileSidebar.selectedKnowledgeDocumentNeedsReindex}
            onDelete={profileSidebar.onKnowledgeDocumentDelete}
            onDraftChange={profileSidebar.onKnowledgeDocumentDraftChange}
            onOpenChange={(open) => {
              if (!open) {
                profileSidebar.closeKnowledgeDocument();
              }
            }}
            onReindex={profileSidebar.onKnowledgeDocumentReindex}
            onSave={profileSidebar.onKnowledgeDocumentSave}
          />
          <Composer
            assistantProfileId={knowledgeDocuments.knowledgeAssistantProfileId}
            canUseKnowledge={isArtificialIntelligenceAssistant}
            clearSelectedSkills={profileSkills.clearSelectedSkills}
            isArtificialIntelligenceOpponent={isArtificialIntelligenceAssistant}
            isOpenRouterModelsLoading={openRouterModelControls.isLoadingModels}
            isSkillOptionsLoading={profileSkills.isLoadingSkills}
            language={props.language}
            markShouldScrollToBottom={markShouldScrollToBottom}
            onKnowledgeReactionSuccess={onKnowledgeReactionSuccess}
            onOpenRouterModelChange={openRouterModelControls.setSelectedModelId}
            onOpenRouterReasoningChange={
              openRouterModelControls.setSelectedReasoning
            }
            onRemoveSelectedSkill={profileSkills.removeSelectedSkill}
            onSkillSelect={profileSkills.selectSkill}
            openRouterModelGroups={openRouterModelControls.modelGroups}
            openRouterModelId={openRouterModelControls.selectedModelId}
            openRouterModelLabel={openRouterModelControls.selectedModelLabel}
            openRouterReasoning={openRouterModelControls.selectedReasoning}
            openRouterReasoningLabel={
              openRouterModelControls.selectedReasoningLabel
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
              isKnowledgeDocumentsLoading={
                profileSidebar.isKnowledgeDocumentsLoading
              }
              isSkillsLoading={profileSidebar.isSkillsLoading}
              knowledgeDocuments={profileSidebar.knowledgeDocuments}
              language={props.language}
              onKnowledgeDocumentCreate={
                isArtificialIntelligenceAssistant
                  ? openSidebarKnowledgeDocumentCreateDialog
                  : undefined
              }
              onKnowledgeDocumentSelect={openKnowledgeDocumentEditDialog}
              onSkillCreate={openSidebarSkillCreateDialog}
              onSkillEdit={openSkillEditDialog}
              onClose={profileSidebar.closeProfile}
              profile={profileSidebar.selectedProfile}
              selectedKnowledgeDocument={
                profileSidebar.selectedKnowledgeDocument
              }
              skills={profileSidebar.skills}
            />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
