"use client";

import { toast } from "sonner";
import { Composer } from "./components/Composer";
import { WorkspaceOrderFileContext } from "./components/CustomerWorkResult";
import { KnowledgeSourceDialog } from "./components/KnowledgeSourceDialog";
import { McpServersDialog } from "./components/McpServersDialog";
import { MessageTimelineSection } from "./components/MessageTimelineSection";
import { ProfileEditDialog } from "./components/ProfileEditDialog";
import { ProfileSidebarPanel } from "./components/ProfileSidebarPanel";
import { ProfileSidebarSheet } from "./components/ProfileSidebarSheet";
import { ThreadContext } from "./components/ThreadContext";
import { ChatParticipantButton } from "./components/ChatParticipantButton";
import { useThreadHasFiles } from "./components/ThreadFiles";
import { useChatModelControls } from "./hooks/use-chat-model-controls";
import { useProfileSidebar } from "./hooks/use-profile-sidebar";
import { useProfileSkills } from "./hooks/use-profile-skills";
import { useThreadMessagesRefetch } from "./hooks/use-thread-messages-refetch";
import { IComponentPropsExtended } from "./interface";
import type { KnowledgeSource, SocialSkill } from "./types";
import { isChatAccessError } from "./utils";
import { cn } from "@sps/shared-frontend-client-utils";
import { ChatThreadPanel } from "@sps/ui-adapter";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { STORE_EMPLOYEE_CHAT_VARIANT } from "@sps/rbac/models/subject/sdk/model";
import { Component as SocialModuleSkill } from "@sps/social/models/skill/frontend/component";
import Link from "next/link";
import {
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
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
  const threadId = props.socialModuleThreadId;
  const workspace = useContext(WorkspaceOrderFileContext);
  const ru = props.language === "ru";
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
  const thread =
    props.socialModuleThread.id === threadId
      ? props.socialModuleThread
      : undefined;
  const isEmployeeChat =
    props.socialModuleChat.variant === STORE_EMPLOYEE_CHAT_VARIANT;
  const isSupport = thread?.isOrderSupport === true;
  const isCustomerWork =
    !isSupport &&
    !isEmployeeChat &&
    (props.socialModuleChat.variant === "customer-work" ||
      thread?.hasCustomerWork === true);
  const threadScope = {
    subjectId: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    socialModuleChatId: props.socialModuleChat.id,
    socialModuleThreadId: threadId,
  };
  const hasThreadFiles = useThreadHasFiles(threadScope, isCustomerWork);
  const staffView = Boolean(props.socialModuleChat.taskChatStaff);
  const workResult = api.customerWorkForThread({
    id: props.data.id,
    threadId: isCustomerWork && !staffView ? threadId : "",
  });
  const work =
    isCustomerWork &&
    workResult.data?.chatId === props.socialModuleChat.id &&
    workResult.data.threadId === threadId &&
    !isChatAccessError(workResult.error)
      ? workResult.data
      : undefined;
  const completedThread =
    !isSupport &&
    (work?.discussionOnly ||
      workspace?.discussionOnly ||
      thread?.isOrderWorkClosed);
  const supportThreadId =
    work?.supportThreadId ??
    workspace?.supportThreadId ??
    thread?.supportThreadId;
  const supportHref = supportThreadId
    ? workspace
      ? `?thread=${encodeURIComponent(supportThreadId)}`
      : `/${props.language}/social/chats/${props.socialModuleChat.id}/threads/${encodeURIComponent(supportThreadId)}`
    : undefined;
  const assistantProfile =
    isCustomerWork || isSupport
      ? null
      : props.knowledgeAssistantProfile ||
        props.artificialIntelligenceOpponentProfile ||
        null;
  const isArtificialIntelligenceAssistant =
    assistantProfile?.variant === "artificial-intelligence";
  const profileSidebar = useProfileSidebar({
    language: props.language,
    summaryOnly: isCustomerWork,
    employeeProfileId: isEmployeeChat ? assistantProfile?.id : undefined,
    subjectId: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    socialModuleChatId: props.socialModuleChat.id,
  });
  const { closeProfile, openProfile } = profileSidebar;
  useImperativeHandle(props.profileOpenRef, () => openProfile, [openProfile]);
  const canEditProfile =
    !isCustomerWork && profileSidebar.canManageSelectedProfile;
  const canAddKnowledge = canEditProfile || profileSidebar.isOwnPersonalProfile;
  const canEditKnowledge =
    canEditProfile ||
    (profileSidebar.isOwnPersonalProfile &&
      (profileSidebar.isCreatingKnowledgeSource ||
        profileSidebar.selectedKnowledgeSource?.editable === true));
  const profileCaption =
    isEmployeeChat &&
    assistantProfile?.id === profileSidebar.selectedProfile?.id
      ? props.language === "ru"
        ? "Сотрудник магазина"
        : "Store employee"
      : undefined;
  const composerSkillsProfileId = assistantProfile?.id || "missing-profile";
  const profileSkills = useProfileSkills({
    language: props.language,
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
  const modelControls = useChatModelControls({
    subjectId: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    socialModuleChatId: props.socialModuleChat.id,
    socialModuleThread: props.socialModuleThread,
    socialModuleThreadId: props.socialModuleThreadId,
    mode:
      (isCustomerWork && !staffView) || isEmployeeChat
        ? "order"
        : isArtificialIntelligenceAssistant &&
            props.socialModuleChat.canManageChat === true
          ? "assistant"
          : undefined,
    catalogRevision: [
      work?.workflow?.stageTitle,
      work?.assignment,
      work?.status,
    ].join(":"),
  });

  function openSidebarSkillCreateDialog(profile: SocialProfile) {
    setEditingSkill(null);
    setSkillDialogTarget({
      orderIndex: profileSidebar.profileSkillIds.length,
      profileId: profile.id,
    });
    setIsSkillDialogOpen(true);
  }

  function openSidebarKnowledgeSourceCreateDialog(profile: SocialProfile) {
    profileSidebar.onKnowledgeSourceCreate(profile);
  }

  function openProfileEditDialog() {
    setIsProfileEditDialogOpen(true);
  }

  function openMcpServersDialog() {
    setIsMcpServersDialogOpen(true);
  }

  function openKnowledgeSourceEditDialog(document: KnowledgeSource) {
    profileSidebar.onKnowledgeSourceSelect(document);
  }

  function openSkillEditDialog(skill: SocialSkill) {
    setEditingSkill(skill);
    setSkillDialogTarget({
      orderIndex: profileSidebar.profileSkillIds.length,
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
  const products = thread?.linkedProducts;
  const showThreadContext = hasThreadFiles || work || products?.length;
  const participants = props.socialModuleChat.participants;
  const opponent = isEmployeeChat
    ? assistantProfile
    : !isCustomerWork &&
        props.socialModuleChat.variant === "default" &&
        participants?.length === 2
      ? participants.find(({ id }) => id !== props.socialModuleProfile.id)
      : undefined;
  const title =
    props.socialModuleThread.title?.trim() ||
    (props.language === "ru" ? "Без названия" : "Untitled");

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-card",
        props.className,
      )}
    >
      <ProfileSidebarSheet
        isOpen={Boolean(profileSidebar.selectedProfile)}
        language={props.language}
        summaryOnly={!canEditProfile}
        onCloseAutoFocus={(event) => {
          if (profileSidebar.profileTrigger.current?.isConnected) {
            event.preventDefault();
            profileSidebar.profileTrigger.current.focus();
          }
        }}
        onOpenChange={(open) => {
          if (!open) closeProfile();
        }}
      >
        <ProfileSidebarPanel
          summaryOnly={!canEditProfile}
          avatar={profileSidebar.selectedAvatar}
          displayName={
            !canEditProfile ? profileSidebar.selectedName : undefined
          }
          hasKnowledgeSourcesError={profileSidebar.hasKnowledgeSourcesError}
          isKnowledgeSourcesLoading={profileSidebar.isKnowledgeSourcesLoading}
          isSkillsLoading={profileSidebar.isSkillsLoading}
          knowledgeSources={profileSidebar.knowledgeSources}
          language={props.language}
          onKnowledgeSourceCreate={
            canAddKnowledge ? openSidebarKnowledgeSourceCreateDialog : undefined
          }
          onKnowledgeSourceSelect={
            canAddKnowledge ? openKnowledgeSourceEditDialog : undefined
          }
          onMcpServersEdit={canEditProfile ? openMcpServersDialog : undefined}
          onProfileEdit={canEditProfile ? openProfileEditDialog : undefined}
          onSkillCreate={
            canEditProfile ? openSidebarSkillCreateDialog : undefined
          }
          onSkillEdit={canEditProfile ? openSkillEditDialog : undefined}
          profile={profileSidebar.selectedProfile}
          profileCaption={profileCaption}
          selectedKnowledgeSource={profileSidebar.selectedKnowledgeSource}
          skills={profileSidebar.skills}
        />
      </ProfileSidebarSheet>
      <ChatThreadPanel
        title={title}
        threadId={props.socialModuleThreadId}
        language={props.language}
        navigation={props.navigation}
        titleContent={
          opponent && (
            <ChatParticipantButton
              profile={opponent}
              language={props.language}
              presentation={props.socialModuleChat.participantPresentations?.find(
                ({ id }) => id === opponent.id,
              )}
              onProfileOpen={openProfile}
            />
          )
        }
        messagesOwnScroll
        messages={
          <>
            <MessageTimelineSection
              orderWork={staffView ? undefined : (work ?? undefined)}
              isCustomerWork={isCustomerWork}
              isEmployeeChat={isEmployeeChat}
              participants={props.socialModuleChat.participants}
              language={props.language}
              markShouldScrollToBottomRef={markShouldScrollToBottomRef}
              onProfileOpen={openProfile}
              socialModuleChatId={props.socialModuleChat.id}
              socialModuleProfileId={props.socialModuleProfile.id}
              socialModuleThreadId={props.socialModuleThreadId}
              subjectId={props.data.id}
              threadMessagesCache={threadMessagesCache}
            />
            <SocialModuleSkill
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
              key={JSON.stringify([
                profileSidebar.selectedProfile?.id,
                profileSidebar.selectedKnowledgeSource?.id,
              ])}
              fileScope={
                canEditProfile &&
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
              document={profileSidebar.selectedKnowledgeSource}
              personal={profileSidebar.isOwnPersonalProfile}
              readOnly={!canEditKnowledge}
              draft={profileSidebar.knowledgeSourceDraft}
              saveError={profileSidebar.knowledgeError?.message}
              saveBlocked={
                profileSidebar.knowledgeError?.status === 409 &&
                !profileSidebar.isCreatingKnowledgeSource
              }
              isDeleting={profileSidebar.isDeletingKnowledgeSource}
              isDirty={profileSidebar.isKnowledgeSourceDirty}
              isOpen={Boolean(profileSidebar.selectedKnowledgeSource)}
              isSaving={profileSidebar.isSavingKnowledgeSource}
              language={props.language}
              mode={
                profileSidebar.isCreatingKnowledgeSource ? "create" : "edit"
              }
              needsReindex={profileSidebar.selectedKnowledgeSourceNeedsReindex}
              onDelete={
                canEditProfile
                  ? profileSidebar.onKnowledgeSourceDelete
                  : undefined
              }
              onDraftChange={profileSidebar.onKnowledgeSourceDraftChange}
              onOpenChange={(open) => {
                if (!open) {
                  profileSidebar.closeKnowledgeSource();
                }
              }}
              onSave={profileSidebar.onKnowledgeSourceSave}
            />
            <McpServersDialog
              language={props.language}
              isOpen={isMcpServersDialogOpen}
              isSaving={profileSidebar.isSavingProfile}
              onOpenChange={setIsMcpServersDialogOpen}
              onSave={(allowedMcpServerIds) => {
                void profileSidebar
                  .onProfileSave({ allowedMcpServerIds })
                  .then(() => {
                    setIsMcpServersDialogOpen(false);
                    toast.success(
                      props.language === "ru"
                        ? "Профиль сохранён"
                        : "Profile saved",
                    );
                  })
                  .catch(() => {
                    /* The SDK displayed the mutation error. */
                  });
              }}
              profile={profileSidebar.selectedProfile}
            />
            <ProfileEditDialog
              avatar={profileSidebar.selectedAvatar}
              onAvatarSave={profileSidebar.onAvatarSave}
              isSavingAvatar={profileSidebar.isSavingAvatar}
              isEmployee={Boolean(profileCaption)}
              isOpen={isProfileEditDialogOpen}
              isSaving={profileSidebar.isSavingProfile}
              language={props.language}
              onOpenChange={setIsProfileEditDialogOpen}
              onSave={async (values) => {
                if (Object.keys(values).length)
                  await profileSidebar.onProfileSave(values);
                setIsProfileEditDialogOpen(false);
              }}
              profile={profileSidebar.selectedProfile}
            />
          </>
        }
        composer={
          completedThread ? (
            <p className="border-t border-border px-4 py-2 text-sm text-muted-foreground">
              {ru ? "Заказ завершён." : "Order completed."}{" "}
              {supportHref && (
                <Link
                  className="underline underline-offset-4"
                  href={supportHref}
                >
                  {ru ? "Написать в поддержку" : "Contact support"}
                </Link>
              )}
            </p>
          ) : (
            <Composer
              isCustomerWork={isCustomerWork}
              isEmployeeChat={isEmployeeChat}
              onEmployeeMessageSaved={
                isEmployeeChat
                  ? profileSidebar.refetchKnowledgeSourceQueries
                  : undefined
              }
              canUseKnowledge={
                isArtificialIntelligenceAssistant && !isEmployeeChat
              }
              clearSelectedSkills={profileSkills.clearSelectedSkills}
              isArtificialIntelligenceOpponent={
                isArtificialIntelligenceAssistant
              }
              isSkillOptionsLoading={profileSkills.isLoadingSkills}
              language={props.language}
              markShouldScrollToBottom={markShouldScrollToBottom}
              modelControls={isSupport ? undefined : modelControls}
              onRemoveSelectedSkill={profileSkills.removeSelectedSkill}
              onSkillSelect={profileSkills.selectSkill}
              profileSkills={profileSkills.profileSkills}
              registerFocusComposerTextArea={registerFocusComposerTextArea}
              selectedSkillIds={profileSkills.selectedSkillIds}
              selectedSkills={profileSkills.selectedSkills}
              socialModuleChatId={props.socialModuleChat.id}
              socialModuleProfileId={props.socialModuleProfile.id}
              socialModuleThreadId={props.socialModuleThreadId}
              subjectId={props.data.id}
              syncSelectedSkillsToDescription={
                profileSkills.syncSelectedSkillsToDescription
              }
              threadMessagesCache={threadMessagesCache}
            />
          )
        }
        context={
          showThreadContext ? (
            <ThreadContext
              {...threadScope}
              key={threadId}
              isCustomerWork={isCustomerWork}
              work={work}
              products={products}
              language={props.language}
            />
          ) : undefined
        }
      />
    </div>
  );
}
