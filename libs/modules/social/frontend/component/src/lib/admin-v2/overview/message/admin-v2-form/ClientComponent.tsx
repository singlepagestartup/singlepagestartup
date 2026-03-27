"use client";

import { Component as ParentComponent } from "@sps/social/models/message/frontend/component";
import { Component as ChatsToMessages } from "@sps/social/relations/chats-to-messages/frontend/component";
import { Component as MessagesToFileStorageModuleFiles } from "@sps/social/relations/messages-to-file-storage-module-files/frontend/component";
import { Component as ProfilesToMessages } from "@sps/social/relations/profiles-to-messages/frontend/component";
import { Component as FileStorageFile } from "@sps/file-storage/models/file/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Chat } from "../../chat";
import { Component as Message } from "../";
import { Component as Profile } from "../../profile";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      profilesToMessages={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ProfilesToMessages
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Profile"
            rightModelAdminFormLabel="Message"
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
                      column: "messageId",
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
                      column: "messageId",
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
      messagesToFileStorageModuleFiles={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <MessagesToFileStorageModuleFiles
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Message"
            rightModelAdminFormLabel="File"
            leftModelAdminForm={({ data }) => {
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
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <FileStorageFile
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.fileStorageModuleFileId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "messageId",
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
