"use client";

import { Composer } from "./components/Composer";
import { KnowledgeDocumentDialog } from "./components/KnowledgeDocumentDialog";
import { MessageEditDialog } from "./components/MessageEditDialog";
import { MessageTimeline } from "./components/MessageTimeline";
import { ProfileSidebarPanel } from "./components/ProfileSidebarPanel";
import { ProfileSidebarSheet } from "./components/ProfileSidebarSheet";
import { useChatComposer } from "./hooks/use-chat-composer";
import { useKnowledgeDocuments } from "./hooks/use-knowledge-documents";
import { useMessageActions } from "./hooks/use-message-actions";
import { useMessageThreadScroll } from "./hooks/use-message-thread-scroll";
import { useOpenRouterModelControls } from "./hooks/use-openrouter-model-controls";
import { useProfileSidebar } from "./hooks/use-profile-sidebar";
import { useProfileSkills } from "./hooks/use-profile-skills";
import { useThreadMessagesRefetch } from "./hooks/use-thread-messages-refetch";
import { IComponentPropsExtended } from "./interface";
import {
  filterSkillMentionOptions,
  getKnowledgeCommandMatch,
  getSkillMentionMatch,
  getTimelineSignature,
  hasKnowledgeMention,
  knowledgeChatCommands,
  knowledgeMentionOption,
  shouldShowKnowledgeMentionOption,
} from "./utils";
import type { KnowledgeDocument, SocialSkill } from "./types";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SocialModuleSkillChatCreateDialog } from "@sps/social/models/skill/frontend/component/src/lib/singlepage/chat-create-dialog";
import { useEffect, useMemo, useRef, useState } from "react";
import type { IModel as SocialProfile } from "@sps/social/models/profile/sdk/model";

interface SkillDialogTarget {
  orderIndex: number;
  profileId: string;
}

export function Component(props: IComponentPropsExtended) {
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SocialSkill | null>(null);
  const [skillDialogTarget, setSkillDialogTarget] =
    useState<SkillDialogTarget | null>(null);
  const focusComposerTextAreaRef = useRef<() => void>(() => {});
  const refetchThreadMessages = useThreadMessagesRefetch({
    subjectId: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    socialModuleChatId: props.socialModuleChat.id,
    socialModuleThreadId: props.socialModuleThreadId,
  });
  const timelineSignature = useMemo(() => {
    return getTimelineSignature(
      props.socialModuleThreadId,
      props.socialModuleMessagesAndActionsQuery,
    );
  }, [props.socialModuleMessagesAndActionsQuery, props.socialModuleThreadId]);
  const timelineItemCount =
    props.socialModuleMessagesAndActionsQuery?.length ?? 0;
  const messageThreadScroll = useMessageThreadScroll({
    socialModuleThreadId: props.socialModuleThreadId,
    timelineItemCount,
    timelineSignature,
  });
  const knowledgeDocuments = useKnowledgeDocuments({
    subjectId: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    socialModuleChat: props.socialModuleChat,
    knowledgeAssistantProfile: props.knowledgeAssistantProfile,
  });
  const profileSidebar = useProfileSidebar({
    subjectId: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    socialModuleChatId: props.socialModuleChat.id,
    isKnowledgeChat: knowledgeDocuments.isKnowledgeChat,
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
    isKnowledgeChat: knowledgeDocuments.isKnowledgeChat,
  });
  const composer = useChatComposer({
    subjectId: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    socialModuleChatId: props.socialModuleChat.id,
    socialModuleThreadId: props.socialModuleThreadId,
    assistantProfileId: knowledgeDocuments.knowledgeAssistantProfileId,
    clearSelectedSkills: profileSkills.clearSelectedSkills,
    isKnowledgeChat: knowledgeDocuments.isKnowledgeChat,
    markShouldScrollToBottom: messageThreadScroll.markShouldScrollToBottom,
    onKnowledgeReactionSuccess() {
      knowledgeDocuments.refetchKnowledgeDocumentQueries();
      profileSidebar.refetchKnowledgeDocumentQueries();
    },
    openRouterModelId: openRouterModelControls.selectedModelId,
    openRouterReasoning: openRouterModelControls.selectedReasoning,
    profileSkills: profileSkills.profileSkills,
    refetchThreadMessages,
    selectedSkillIds: profileSkills.selectedSkillIds,
  });

  useEffect(() => {
    profileSkills.syncSelectedSkillsToDescription(composer.description);
  }, [composer.description, profileSkills.syncSelectedSkillsToDescription]);

  focusComposerTextAreaRef.current = composer.focusComposerTextArea;
  const messageActions = useMessageActions({
    subjectId: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    socialModuleChatId: props.socialModuleChat.id,
    refetchThreadMessages,
  });
  const knowledgeCommandMatch = getKnowledgeCommandMatch(composer.description);
  const commandQuery = knowledgeCommandMatch?.query || "";
  const visibleKnowledgeChatCommands = useMemo(() => {
    if (!knowledgeDocuments.isKnowledgeChat || !knowledgeCommandMatch) {
      return [];
    }

    const normalizedQuery = commandQuery.toLowerCase();
    const commandNeedle = normalizedQuery ? `/${normalizedQuery}` : "";

    return knowledgeChatCommands.filter((command) => {
      return (
        command.value.toLowerCase().includes(commandNeedle) ||
        command.title.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [commandQuery, knowledgeCommandMatch, knowledgeDocuments.isKnowledgeChat]);
  const isKnowledgeCommandPickerOpen =
    knowledgeDocuments.isKnowledgeChat && Boolean(knowledgeCommandMatch);
  const visibleSkillMentionOptions = useMemo(() => {
    return filterSkillMentionOptions(
      profileSkills.profileSkills,
      composer.description,
    );
  }, [composer.description, profileSkills.profileSkills]);
  const visibleKnowledgeMentionOption =
    knowledgeDocuments.isKnowledgeChat &&
    shouldShowKnowledgeMentionOption(composer.description)
      ? knowledgeMentionOption
      : null;
  const isKnowledgeSearchSelected = hasKnowledgeMention(composer.description);
  const isSkillMentionPickerOpen =
    Boolean(getSkillMentionMatch(composer.description)) &&
    !isKnowledgeCommandPickerOpen;

  function selectKnowledgeCommand(commandValue: string) {
    const currentDescription = composer.form.getValues("description") || "";
    const currentMatch = getKnowledgeCommandMatch(currentDescription);
    const resolvedCommandValue =
      hasKnowledgeMention(currentDescription) &&
      commandValue.toLowerCase().startsWith("@knowledge ")
        ? commandValue.replace(/^@knowledge\s+/i, "")
        : commandValue;
    const nextDescription = currentMatch
      ? `${currentDescription.slice(
          0,
          currentMatch.startIndex,
        )}${resolvedCommandValue} `
      : `${currentDescription.trimEnd()} ${resolvedCommandValue} `.trimStart();

    composer.form.setValue("description", nextDescription, {
      shouldDirty: true,
      shouldValidate: true,
    });
    composer.focusComposerTextArea();
  }

  function selectKnowledgeMention() {
    const currentDescription = composer.form.getValues("description") || "";
    const currentMatch = getSkillMentionMatch(currentDescription);
    const nextDescription = currentMatch
      ? `${currentDescription.slice(0, currentMatch.startIndex)}@knowledge `
      : `${currentDescription.trimEnd()} @knowledge `;

    composer.form.setValue("description", nextDescription, {
      shouldDirty: true,
      shouldValidate: true,
    });
    composer.focusComposerTextArea();
  }

  function removeKnowledgeMention() {
    const currentDescription = composer.form.getValues("description") || "";
    const nextDescription = currentDescription
      .replace(/(^|\s)@knowledge(?=\s|$)\s*/i, "$1")
      .replace(/\s{2,}/g, " ")
      .trimStart();

    composer.form.setValue("description", nextDescription, {
      shouldDirty: true,
      shouldValidate: true,
    });
    composer.focusComposerTextArea();
  }

  function selectSkillMention(skill: (typeof profileSkills.profileSkills)[0]) {
    const currentDescription = composer.form.getValues("description") || "";
    const currentMatch = getSkillMentionMatch(currentDescription);
    const nextDescription = currentMatch
      ? `${currentDescription.slice(0, currentMatch.startIndex)}@${skill.slug} `
      : `${currentDescription.trimEnd()} @${skill.slug} `;

    profileSkills.selectSkill(skill);
    composer.form.setValue("description", nextDescription, {
      shouldDirty: true,
      shouldValidate: true,
    });
    composer.focusComposerTextArea();
  }

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
  const isArtificialIntelligenceOpponent =
    (
      props.artificialIntelligenceOpponentProfile ||
      props.knowledgeAssistantProfile
    )?.variant === "artificial-intelligence";

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
            knowledgeDocuments.isKnowledgeChat
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
          <div
            ref={messageThreadScroll.messagesViewportRef}
            onScroll={messageThreadScroll.updateIsAtBottom}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
          >
            <MessageTimeline
              isDeleting={messageActions.deleteMessage.isPending}
              items={props.socialModuleMessagesAndActionsQuery}
              language={props.language}
              messagesContentRef={messageThreadScroll.messagesContentRef}
              onMessageDelete={messageActions.onMessageRowDelete}
              onMessageEdit={messageActions.onMessageRowEdit}
              onProfileOpen={profileSidebar.openProfile}
            />
            <div
              ref={messageThreadScroll.messagesEndRef}
              className="h-px"
              aria-hidden="true"
            />
          </div>
          <MessageEditDialog
            form={messageActions.messageEditForm}
            isOpen={messageActions.isEditOpen}
            isUpdating={messageActions.updateMessage.isPending}
            onOpenChange={(open) => {
              messageActions.setIsEditOpen(open);

              if (!open) {
                messageActions.setEditingMessageId(null);
              }
            }}
            onSubmit={messageActions.onMessageEditSubmit}
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
            isDirty={profileSidebar.isKnowledgeDocumentDirty}
            isOpen={Boolean(profileSidebar.selectedKnowledgeDocument)}
            isReindexing={profileSidebar.isReindexingKnowledgeDocument}
            isSaving={profileSidebar.isSavingKnowledgeDocument}
            language={props.language}
            mode={
              profileSidebar.isCreatingKnowledgeDocument ? "create" : "edit"
            }
            needsReindex={profileSidebar.selectedKnowledgeDocumentNeedsReindex}
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
            canSubmit={composer.canSubmit}
            fileInputRef={composer.fileInputRef}
            form={composer.form}
            isArtificialIntelligenceOpponent={isArtificialIntelligenceOpponent}
            isKnowledgeCommandPickerOpen={isKnowledgeCommandPickerOpen}
            isKnowledgeSearchSelected={isKnowledgeSearchSelected}
            isSkillMentionPickerOpen={isSkillMentionPickerOpen}
            isSkillOptionsLoading={profileSkills.isLoadingSkills}
            knowledgeMentionOption={visibleKnowledgeMentionOption}
            language={props.language}
            onKnowledgeCommandSelect={selectKnowledgeCommand}
            onKnowledgeMentionSelect={selectKnowledgeMention}
            onOpenRouterModelChange={openRouterModelControls.setSelectedModelId}
            onOpenRouterReasoningChange={
              openRouterModelControls.setSelectedReasoning
            }
            onRemoveKnowledgeSearch={removeKnowledgeMention}
            onRemoveSelectedSkill={profileSkills.removeSelectedSkill}
            onSkillMentionSelect={selectSkillMention}
            openRouterModelGroups={openRouterModelControls.modelGroups}
            openRouterModelId={openRouterModelControls.selectedModelId}
            openRouterModelLabel={openRouterModelControls.selectedModelLabel}
            openRouterReasoning={openRouterModelControls.selectedReasoning}
            openRouterReasoningLabel={
              openRouterModelControls.selectedReasoningLabel
            }
            onSubmit={composer.onSubmit}
            isOpenRouterModelsLoading={openRouterModelControls.isLoadingModels}
            showOpenRouterControls={
              knowledgeDocuments.isKnowledgeChat &&
              isArtificialIntelligenceOpponent
            }
            selectedFileNames={composer.selectedFileNames}
            selectedSkills={profileSkills.selectedSkills}
            textareaRef={composer.textareaRef}
            visibleKnowledgeChatCommands={visibleKnowledgeChatCommands}
            visibleSkillMentionOptions={visibleSkillMentionOptions}
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
                knowledgeDocuments.isKnowledgeChat
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
