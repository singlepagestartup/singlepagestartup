"use client";

import type { IChatProfileOpen } from "../interface";

import { MessageEditDialog } from "./MessageEditDialog";
import { ThreadOrderStage } from "./ThreadCustomerWork";
import type { ICustomerWorkView } from "@sps/rbac/models/subject/sdk/model";
import { OrderPaymentButtons } from "./OrderPaymentButtons";
import {
  readOrderFileReview,
  readOrderCheckoutButtons,
} from "@sps/rbac/models/subject/sdk/model/src/lib/order-work";
import { MessageTimeline } from "./MessageTimeline";
import { useMessageActions } from "../hooks/use-message-actions";
import { useMarkThreadRead } from "../hooks/use-mark-thread-read";
import { useMessageThreadScroll } from "../hooks/use-message-thread-scroll";
import { useThreadMessages } from "../hooks/use-thread-messages";
import type { ThreadMessagesCache } from "../hooks/use-thread-messages-refetch";
import { createSocialModuleMessagesAndActionsQuery } from "../timeline";
import { getTimelineSignature, isChatAccessError } from "../utils";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import {
  memo,
  useEffect,
  useMemo,
  useState,
  type MutableRefObject,
} from "react";

interface MessageTimelineSectionProps {
  orderWork?: ICustomerWorkView;
  isCustomerWork: boolean;
  isEmployeeChat?: boolean;
  language: string;
  participants?: ISocialModuleProfile[];
  /**
   * Callback-ref bridge to the composer: the shell passes a stable ref, the
   * section registers its scroll handler into it. This keeps the composer →
   * timeline communication free of message-array props.
   */
  markShouldScrollToBottomRef: MutableRefObject<() => void>;
  onProfileOpen?: IChatProfileOpen;
  socialModuleChatId: string;
  socialModuleProfileId: string;
  socialModuleThreadId: string;
  subjectId: string;
  /**
   * Single thread-message cache instance owned by the shell (issue #195): the
   * same object reaches the composer (append on create) and this section's
   * message actions (patch/remove on edit/delete), so all targeted mutations
   * flow through one cache rather than two duplicate hook instances.
   */
  threadMessagesCache: ThreadMessagesCache;
}

/**
 * Timeline data boundary (issue #195): the React Query subscriptions for
 * messages and actions live HERE, not in the chat shell. Cache appends,
 * targeted patches, AI-flow refetches, and WS invalidation rerender only this
 * component — the composer, sidebar, and the rest of the chat shell receive
 * no message-array props and stay untouched.
 *
 * Wrapped in React.memo with stable props (ids, language, stable callbacks,
 * a ref), so shell rerenders (sidebar toggles, skill selection, …) skip the
 * timeline as well.
 */
export const MessageTimelineSection = memo(function MessageTimelineSection(
  props: MessageTimelineSectionProps,
) {
  const workRefreshInterval =
    props.isCustomerWork || props.isEmployeeChat ? 3000 : false;
  const {
    data: loadedMessages,
    error: messagesError,
    isLoading: socialModuleMessagesIsLoading,
  } = useThreadMessages(props, workRefreshInterval);
  const {
    data: loadedActions,
    error: actionsError,
    isLoading: socialModuleActionsIsLoading,
  } = api.socialModuleProfileFindByIdChatFindByIdActionFind({
    id: props.subjectId,
    socialModuleProfileId: props.socialModuleProfileId,
    socialModuleChatId: props.socialModuleChatId,
    params: {
      socialModuleThreadId: props.socialModuleThreadId,
      orderBy: {
        and: [
          {
            column: "createdAt",
            method: "desc",
          },
        ],
      },
    },
    options: {
      headers: {
        "Cache-Control": "no-store",
      },
    },
    reactQueryOptions: { refetchInterval: workRefreshInterval },
  });

  const socialModuleMessages = isChatAccessError(messagesError)
    ? undefined
    : loadedMessages;
  const socialModuleActions = isChatAccessError(actionsError)
    ? undefined
    : loadedActions;
  const [expiryTick, setExpiryTick] = useState(0);
  const visibleActions = useMemo(() => {
    const now = Date.now();
    return socialModuleActions?.filter((action) => {
      if (action.variant !== "typing") return true;
      return (
        !action.actorProfileIds?.includes(props.socialModuleProfileId) &&
        new Date(action.expiresAt).getTime() > now
      );
    });
  }, [socialModuleActions, props.socialModuleProfileId, expiryTick]);
  useEffect(() => {
    const expiries = visibleActions
      ?.filter((action) => action.variant === "typing")
      .map((action) => new Date(action.expiresAt).getTime());
    if (!expiries?.length) return;
    const timer = setTimeout(
      () => setExpiryTick((tick) => tick + 1),
      Math.max(0, Math.min(...expiries) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [visibleActions]);
  const socialModuleMessagesAndActionsQuery = useMemo(() => {
    return createSocialModuleMessagesAndActionsQuery({
      socialModuleMessages,
      socialModuleActions: visibleActions,
    });
  }, [socialModuleMessages, visibleActions]);

  const messageActions = useMessageActions({
    subjectId: props.subjectId,
    socialModuleProfileId: props.socialModuleProfileId,
    socialModuleChatId: props.socialModuleChatId,
    threadMessagesCache: props.threadMessagesCache,
  });

  const timelineSignature = useMemo(() => {
    return getTimelineSignature(
      props.socialModuleThreadId,
      socialModuleMessagesAndActionsQuery,
    );
  }, [props.socialModuleThreadId, socialModuleMessagesAndActionsQuery]);
  const review = useMemo(() => {
    if (props.orderWork?.workflow?.orderStep !== "review") return;
    const latest = socialModuleMessagesAndActionsQuery.findLast(
      (item) =>
        item.type === "message" &&
        item.data.variant === "customer-work" &&
        typeof item.data.metadata?.orderResultFileId === "string",
    );
    if (latest?.type !== "message") return;
    const prompt = readOrderFileReview(latest.data);
    return prompt ? { messageId: latest.data.id, prompt } : undefined;
  }, [
    props.orderWork?.workflow?.orderStep,
    socialModuleMessagesAndActionsQuery,
  ]);
  const orderStage = useMemo(
    () =>
      props.orderWork?.workflow?.orderStep ? (
        <ThreadOrderStage
          subjectId={props.subjectId}
          work={props.orderWork}
          language={props.language}
          prompt={review?.prompt}
        />
      ) : undefined,
    [props.subjectId, props.orderWork, props.language, review],
  );
  const payment = useMemo(() => {
    const work = props.orderWork;
    const promptId = work?.workflow?.checkoutPromptId;
    if (!work || !promptId) return;
    const current = socialModuleMessagesAndActionsQuery.find(
      (item) => item.type === "message" && item.data.id === promptId,
    );
    const rows =
      current?.type === "message" && readOrderCheckoutButtons(current.data);
    return rows ? (
      <OrderPaymentButtons
        subjectId={props.subjectId}
        language={props.language}
        work={work}
        messageId={promptId}
        rows={rows}
      />
    ) : undefined;
  }, [
    props.orderWork,
    props.subjectId,
    props.language,
    socialModuleMessagesAndActionsQuery,
  ]);
  const timelineItemCount = socialModuleMessagesAndActionsQuery.length;
  const messageThreadScroll = useMessageThreadScroll({
    socialModuleThreadId: props.socialModuleThreadId,
    timelineItemCount,
    timelineSignature,
  });
  const latestMessage = socialModuleMessagesAndActionsQuery.findLast(
    (item) => item.type === "message",
  );
  useMarkThreadRead({
    subjectId: props.subjectId,
    socialModuleChatId: props.socialModuleChatId,
    socialModuleThreadId: props.socialModuleThreadId,
    messageId: latestMessage?.data.id,
    viewportRef: messageThreadScroll.messagesViewportRef,
  });

  useEffect(() => {
    props.markShouldScrollToBottomRef.current =
      messageThreadScroll.markShouldScrollToBottom;

    return () => {
      props.markShouldScrollToBottomRef.current = () => {};
    };
  }, [
    messageThreadScroll.markShouldScrollToBottom,
    props.markShouldScrollToBottomRef,
  ]);

  if (socialModuleMessagesIsLoading || socialModuleActionsIsLoading) {
    return (
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4"
        aria-busy="true"
      >
        <div className="flex min-w-0 flex-col gap-3" aria-hidden="true">
          {[0, 1, 2].map((placeholderIndex) => {
            return (
              <div
                key={placeholderIndex}
                className="h-16 w-3/4 motion-safe:animate-pulse rounded-2xl bg-muted even:ml-auto even:w-1/2"
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={messageThreadScroll.messagesViewportRef}
        onScroll={messageThreadScroll.updateIsAtBottom}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4"
      >
        <MessageTimeline
          deletingMessageId={messageActions.deletingMessageId}
          items={socialModuleMessagesAndActionsQuery}
          reviewMessageId={
            review?.messageId ?? props.orderWork?.workflow?.checkoutPromptId
          }
          reviewSlot={review ? orderStage : payment}
          subjectId={props.subjectId}
          socialModuleProfileId={props.socialModuleProfileId}
          threadId={props.socialModuleThreadId}
          participants={props.participants}
          language={props.language}
          messagesContentRef={messageThreadScroll.messagesContentRef}
          onMessageDelete={messageActions.onMessageRowDelete}
          onMessageEdit={messageActions.onMessageRowEdit}
          onProfileOpen={props.onProfileOpen}
        />
        {!review && orderStage}
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
        language={props.language}
        onOpenChange={(open) => {
          messageActions.setIsEditOpen(open);

          if (!open) {
            messageActions.setEditingMessageId(null);
          }
        }}
        onSubmit={messageActions.onMessageEditSubmit}
      />
    </>
  );
});
