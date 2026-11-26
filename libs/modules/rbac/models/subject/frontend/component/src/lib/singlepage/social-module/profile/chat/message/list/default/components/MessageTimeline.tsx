"use client";

import { TypingIndicator } from "./TypingIndicator";

import { ActionProfileLoader } from "./ActionProfileLoader";
import { AiExecutionActionRow } from "./AiExecutionActionRow";
import { areActionRowPropsEqual } from "./action-row-memo";
import { MessageProfileLoader } from "./MessageProfileLoader";
import { PrivateMessageAttachments } from "./PrivateMessageAttachments";
import { CustomerWorkResult } from "./CustomerWorkResult";
import { Component as SocialModuleAction } from "@sps/social/models/action/frontend/component";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import type {
  IChatAttachmentDownload,
  IChatProfileOpen,
  ISocialModuleMessagesAndActionsQuery,
} from "../interface";
import type { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import {
  AI_EXECUTION_ACTION_VARIANT,
  readCustomerWorkRatePrompt,
} from "@sps/rbac/models/subject/sdk/model";
import {
  readOrderFileReview,
  readOrderCheckoutButtons,
} from "@sps/rbac/models/subject/sdk/model/src/lib/order-work";
import { MessageSquare } from "lucide-react";
import { memo, type ReactNode, type RefObject } from "react";

type TimelineItem = ISocialModuleMessagesAndActionsQuery[number];
type TimelineMessage = Extract<TimelineItem, { type: "message" }>["data"];
type TimelineAction = Extract<TimelineItem, { type: "action" }>["data"];

interface MessageTimelineProps {
  interactionSlots?: ReadonlyMap<string, ReactNode>;
  deletingMessageId: string | null;
  items: ISocialModuleMessagesAndActionsQuery | undefined;
  participants?: ISocialModuleProfile[];
  language: string;
  socialModuleProfileId?: string;
  readOnly?: boolean;
  subjectId: string;
  threadId: string;
  messagesContentRef: RefObject<HTMLDivElement | null>;
  onMessageDelete?: (message: ISocialModuleMessage) => void;
  onMessageEdit?: (message: ISocialModuleMessage) => void;
  onProfileOpen?: IChatProfileOpen;
  onAttachmentDownload?: IChatAttachmentDownload;
}

interface MessageRowProps {
  interactionSlot?: ReactNode;
  isDeleting: boolean;
  isOwnMessage: boolean;
  language: string;
  message: TimelineMessage;
  subjectId: string;
  threadId: string;
  participants?: ISocialModuleProfile[];
  onMessageDelete?: (message: ISocialModuleMessage) => void;
  onMessageEdit?: (message: ISocialModuleMessage) => void;
  onProfileOpen?: IChatProfileOpen;
  onAttachmentDownload?: IChatAttachmentDownload;
}

/**
 * Memoized row boundary: the per-message profile loader query and the message
 * row markup rerender only when this row's own props change - appending or
 * mutating sibling rows leaves this row untouched (issue #195).
 */
const MemoizedMessageRow = memo(function MemoizedMessageRow(
  props: MessageRowProps,
) {
  const privateAttachments = props.message.privateAttachments;
  const resultFileId =
    props.message.variant === "customer-work"
      ? (props.message.metadata?.orderResultFileId ??
        props.message.metadata?.customerWorkResultVersionId)
      : undefined;
  return (
    <MessageProfileLoader
      message={props.message}
      participants={props.participants}
    >
      {({ presentation, profile }) => {
        return (
          <SocialModuleProfile
            isServer={false}
            variant="chat-message-row"
            data={presentation}
            avatar={presentation.avatar}
            profile={profile}
            language={props.language}
            message={props.message}
            isOwnMessage={props.isOwnMessage}
            attachmentsSlot={
              privateAttachments?.length ? (
                <PrivateMessageAttachments
                  subjectId={props.subjectId}
                  threadId={props.threadId}
                  messageId={props.message.id}
                  language={props.language}
                  attachments={privateAttachments}
                  document={Boolean(
                    props.message.workReplyKey &&
                    props.message.metadata?.orderDocument,
                  )}
                  onDownload={props.onAttachmentDownload}
                />
              ) : undefined
            }
            messageContentSlot={
              typeof resultFileId === "string" &&
              !privateAttachments?.some(({ id }) => id === resultFileId) && (
                <CustomerWorkResult
                  subjectId={props.subjectId}
                  threadId={props.threadId}
                  fileId={resultFileId}
                  language={props.language}
                />
              )
            }
            interactionSlot={
              props.interactionSlot ??
              (readOrderFileReview(props.message) ||
              readOrderCheckoutButtons(props.message) ||
              readCustomerWorkRatePrompt(props.message)
                ? false
                : undefined)
            }
            isDeleting={props.isDeleting}
            onProfileOpen={props.onProfileOpen}
            onEdit={
              props.message.variant === "customer-work"
                ? undefined
                : props.onMessageEdit
            }
            onDelete={
              props.message.variant === "customer-work"
                ? undefined
                : props.onMessageDelete
            }
          />
        );
      }}
    </MessageProfileLoader>
  );
});

interface ActionRowProps {
  action: TimelineAction;
  language: string;
}

const MemoizedActionRow = memo(function MemoizedActionRow(
  props: ActionRowProps,
) {
  return (
    <ActionProfileLoader action={props.action} language={props.language}>
      {(profile) => {
        if (props.action.variant === "typing") {
          return (
            <TypingIndicator language={props.language} name={profile.slug} />
          );
        }
        if (props.action.variant === AI_EXECUTION_ACTION_VARIANT) {
          return (
            <AiExecutionActionRow
              action={props.action}
              language={props.language}
              profile={profile}
            />
          );
        }

        return (
          <SocialModuleAction
            isServer={false}
            variant="chat-action-row"
            dataSource="props"
            data={props.action}
            language={props.language}
            profile={profile}
          />
        );
      }}
    </ActionProfileLoader>
  );
}, areActionRowPropsEqual);

export function MessageTimeline(props: MessageTimelineProps) {
  const ru = props.language === "ru";
  if (!props.items?.length) {
    return (
      <div
        ref={props.messagesContentRef}
        className="flex gap-3 p-5"
        role="status"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
          <MessageSquare className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            {ru ? "Сообщений пока нет" : "No messages yet"}
          </p>
          {!props.readOnly && (
            <p className="text-sm leading-6">
              {ru
                ? "Отправьте первое сообщение."
                : "Send the first message to start this thread."}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={props.messagesContentRef}
      className="@container/timeline flex min-w-0 flex-col gap-2.5"
      role="log"
      aria-label={ru ? "Сообщения" : "Messages"}
    >
      {props.items.map((socialModuleMessageOrAction) => {
        if (socialModuleMessageOrAction.type === "message") {
          const message = socialModuleMessageOrAction.data;
          const isOwnMessage = Boolean(
            props.socialModuleProfileId &&
            (message.authorProfileIds?.includes(props.socialModuleProfileId) ||
              message.authorProfiles?.some(
                ({ id }) => id === props.socialModuleProfileId,
              )),
          );

          return (
            <MemoizedMessageRow
              key={message.id}
              isDeleting={props.deletingMessageId === message.id}
              isOwnMessage={isOwnMessage}
              interactionSlot={props.interactionSlots?.get(message.id)}
              language={props.language}
              message={message}
              subjectId={props.subjectId}
              threadId={props.threadId}
              participants={props.participants}
              onMessageDelete={props.onMessageDelete}
              onMessageEdit={props.onMessageEdit}
              onProfileOpen={props.onProfileOpen}
              onAttachmentDownload={props.onAttachmentDownload}
            />
          );
        }

        const action = socialModuleMessageOrAction.data;

        return (
          <MemoizedActionRow
            key={action.id}
            action={action}
            language={props.language}
          />
        );
      })}
    </div>
  );
}
