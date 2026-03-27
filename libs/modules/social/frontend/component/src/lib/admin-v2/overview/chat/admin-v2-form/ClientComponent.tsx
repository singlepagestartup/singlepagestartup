"use client";

import { Component as ParentComponent } from "@sps/social/models/chat/frontend/component";
import { Component as ChatsToActions } from "@sps/social/relations/chats-to-actions/frontend/component";
import { Component as ChatsToMessages } from "@sps/social/relations/chats-to-messages/frontend/component";
import { Component as ChatsToThreads } from "@sps/social/relations/chats-to-threads/frontend/component";
import { Component as ProfilesToChats } from "@sps/social/relations/profiles-to-chats/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Action } from "../../action";
import { Component as Chat } from "../";
import { Component as Message } from "../../message";
import { Component as Profile } from "../../profile";
import { Component as Thread } from "../../thread";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      profilesToChats={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ProfilesToChats
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Profile"
            rightModelAdminFormLabel="Chat"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Profile
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.profileId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Chat
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.chatId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "chatId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
      chatsToMessages={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ChatsToMessages
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Chat"
            rightModelAdminFormLabel="Message"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Chat
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.chatId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Message
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.messageId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "chatId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
      chatsToThreads={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ChatsToThreads
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Chat"
            rightModelAdminFormLabel="Thread"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Chat
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.chatId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Thread
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.threadId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "chatId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
      chatsToActions={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ChatsToActions
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Chat"
            rightModelAdminFormLabel="Action"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Chat
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.chatId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Action
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.actionId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "chatId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
    />
  );
}
