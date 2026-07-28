"use client";

import { MessageEditDialog } from "./MessageEditDialog";
import { MessageTimeline } from "./MessageTimeline";
import { useMessageActions } from "../hooks/use-message-actions";
import { useMessageThreadScroll } from "../hooks/use-message-thread-scroll";
import type { ThreadMessagesCache } from "../hooks/use-thread-messages-refetch";
import { createSocialModuleMessagesAndActionsQuery } from "../timeline";
import { getTimelineSignature } from "../utils";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { memo, useEffect, useMemo, type MutableRefObject } from "react";

interface MessageTimelineSectionProps {
  language: string;
  /**
   * Callback-ref bridge to the composer: the shell passes a stable ref, the
   * section registers its scroll handler into it. This keeps the composer →
   * timeline communication free of message-array props.
   */
  markShouldScrollToBottomRef: MutableRefObject<() => void>;
  onProfileOpen: (profile: ISocialModuleProfile) => void;
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
  const {
    data: socialModuleMessages,
    isLoading: socialModuleMessagesIsLoading,
  } = api.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFind({
    id: props.subjectId,
    socialModuleProfileId: props.socialModuleProfileId,
    socialModuleChatId: props.socialModuleChatId,
    socialModuleThreadId: props.socialModuleThreadId,
    params: {
      orderBy: {
        and: [
          {
            column: "createdAt",
            method: "asc",
          },
        ],
      },
    },
    options: {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  });
  const { data: socialModuleActions, isLoading: socialModuleActionsIsLoading } =
    api.socialModuleProfileFindByIdChatFindByIdActionFind({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
      params: {
        socialModuleThreadId: props.socialModuleThreadId,
        orderBy: {
          and: [
            {
              column: "createdAt",
              method: "asc",
            },
          ],
        },
      },
      options: {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    });

  const socialModuleMessagesAndActionsQuery = useMemo(() => {
    return createSocialModuleMessagesAndActionsQuery({
      socialModuleMessages,
      socialModuleActions,
    });
  }, [socialModuleMessages, socialModuleActions]);

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
  const timelineItemCount = socialModuleMessagesAndActionsQuery.length;
  const messageThreadScroll = useMessageThreadScroll({
    socialModuleThreadId: props.socialModuleThreadId,
    timelineItemCount,
    timelineSignature,
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
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          {[0, 1, 2].map((placeholderIndex) => {
            return (
              <div
                key={placeholderIndex}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
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
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
      >
        <MessageTimeline
          deletingMessageId={messageActions.deletingMessageId}
          items={socialModuleMessagesAndActionsQuery}
          language={props.language}
          messagesContentRef={messageThreadScroll.messagesContentRef}
          onMessageDelete={messageActions.onMessageRowDelete}
          onMessageEdit={messageActions.onMessageRowEdit}
          onProfileOpen={props.onProfileOpen}
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
    </>
  );
});
