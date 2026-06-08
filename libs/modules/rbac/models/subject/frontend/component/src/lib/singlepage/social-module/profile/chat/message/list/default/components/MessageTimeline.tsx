"use client";

import { ActionProfileLoader } from "./ActionProfileLoader";
import { MessageProfileLoader } from "./MessageProfileLoader";
import { Component as SocialModuleActionChatActionRow } from "@sps/social/models/action/frontend/component/src/lib/singlepage/chat-action-row";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import type { IComponentPropsExtended } from "../interface";
import type { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import type { RefObject } from "react";

interface MessageTimelineProps {
  isDeleting: boolean;
  items: IComponentPropsExtended["socialModuleMessagesAndActionsQuery"];
  language: string;
  messagesContentRef: RefObject<HTMLDivElement | null>;
  onMessageDelete: (message: ISocialModuleMessage) => void;
  onMessageEdit: (message: ISocialModuleMessage) => void;
  onProfileOpen: (profile: ISocialModuleProfile) => void;
}

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
      {props.items.map((socialModuleMessageOrAction, index) => {
        if (socialModuleMessageOrAction.type === "message") {
          const message = socialModuleMessageOrAction.data;

          return (
            <MessageProfileLoader key={message.id} messageId={message.id}>
              {(profile) => {
                return (
                  <SocialModuleProfile
                    isServer={false}
                    variant="chat-message-row"
                    data={profile}
                    language={props.language}
                    message={message}
                    isDeleting={props.isDeleting}
                    onProfileOpen={props.onProfileOpen}
                    onEdit={props.onMessageEdit}
                    onDelete={props.onMessageDelete}
                  />
                );
              }}
            </MessageProfileLoader>
          );
        }

        const action = socialModuleMessageOrAction.data;

        return (
          <ActionProfileLoader
            key={action.id || index}
            actionId={action.id}
            language={props.language}
          >
            {(profile) => {
              return (
                <SocialModuleActionChatActionRow
                  isServer={false}
                  variant="chat-action-row"
                  data={action}
                  language={props.language}
                  profile={profile}
                />
              );
            }}
          </ActionProfileLoader>
        );
      })}
    </div>
  );
}
