"use client";

import { ActionProfileLoader } from "./ActionProfileLoader";
import { AiExecutionActionRow } from "./AiExecutionActionRow";
import { areActionRowPropsEqual } from "./action-row-memo";
import { MessageProfileLoader } from "./MessageProfileLoader";
import { PrivateMessageAttachments } from "./PrivateMessageAttachments";
import { CustomerWorkResult } from "./CustomerWorkResult";
import { Component as SocialModuleAction } from "@sps/social/models/action/frontend/component";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import type { ISocialModuleMessagesAndActionsQuery } from "../interface";
import type { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { AI_EXECUTION_ACTION_VARIANT } from "@sps/rbac/models/subject/sdk/model";
import { memo, type RefObject } from "react";

type TimelineItem = ISocialModuleMessagesAndActionsQuery[number];
type TimelineMessage = Extract<TimelineItem, { type: "message" }>["data"];
type TimelineAction = Extract<TimelineItem, { type: "action" }>["data"];

interface MessageTimelineProps {
  deletingMessageId: string | null;
  items: ISocialModuleMessagesAndActionsQuery | undefined;
  participants?: ISocialModuleProfile[];
  language: string;
  subjectId: string;
  threadId: string;
  messagesContentRef: RefObject<HTMLDivElement | null>;
  onMessageDelete: (message: ISocialModuleMessage) => void;
  onMessageEdit: (message: ISocialModuleMessage) => void;
  onProfileOpen?: (profile: ISocialModuleProfile) => void;
}

interface MessageRowProps {
  isDeleting: boolean;
  language: string;
  message: TimelineMessage;
  subjectId: string;
  threadId: string;
  participants?: ISocialModuleProfile[];
  onMessageDelete: (message: ISocialModuleMessage) => void;
  onMessageEdit: (message: ISocialModuleMessage) => void;
  onProfileOpen?: (profile: ISocialModuleProfile) => void;
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
  const resultVersionId =
    props.message.variant === "customer-work"
      ? props.message.metadata?.customerWorkResultVersionId
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
            messageContentSlot={
              <>
                {privateAttachments?.length ? (
                  <PrivateMessageAttachments
                    subjectId={props.subjectId}
                    threadId={props.threadId}
                    messageId={props.message.id}
                    language={props.language}
                    attachments={privateAttachments}
                  />
                ) : null}
                {typeof resultVersionId === "string" && (
                  <CustomerWorkResult
                    subjectId={props.subjectId}
                    threadId={props.threadId}
                    versionId={resultVersionId}
                    language={props.language}
                  />
                )}
              </>
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
  if (!props.items?.length) {
    return (
      <div className="flex h-full min-h-80 flex-col items-center justify-center text-center">
        <h3 className="text-sm font-medium text-slate-700">No messages yet</h3>
        <p className="mt-1 max-w-sm text-xs text-slate-400">
          Send the first message to start this thread.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={props.messagesContentRef}
      className="mx-auto flex w-full max-w-4xl flex-col gap-1"
    >
      {props.items.map((socialModuleMessageOrAction) => {
        if (socialModuleMessageOrAction.type === "message") {
          const message = socialModuleMessageOrAction.data;

          return (
            <MemoizedMessageRow
              key={message.id}
              isDeleting={props.deletingMessageId === message.id}
              language={props.language}
              message={message}
              subjectId={props.subjectId}
              threadId={props.threadId}
              participants={props.participants}
              onMessageDelete={props.onMessageDelete}
              onMessageEdit={props.onMessageEdit}
              onProfileOpen={props.onProfileOpen}
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
