"use client";

import { Component as ParentComponent } from "@sps/social/models/message/frontend/component";
import { Component as ProfilesToMessages } from "@sps/social/relations/profiles-to-messages/frontend/component";
import { Component as ChatsToMessages } from "@sps/social/relations/chats-to-messages/frontend/component";
import { Component as MessagesToFileStorageModuleFiles } from "@sps/social/relations/messages-to-file-storage-module-files/frontend/component";

export function Component() {
  return (
    <ParentComponent
      isServer={false}
      variant="admin-table"
      adminForm={(props) => {
        return (
          <ParentComponent
            isServer={false}
            data={props.data}
            variant="admin-form"
            profilesToMessages={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ProfilesToMessages
                  isServer={isServer}
                  variant="admin-table"
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
            chatsToMessages={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ChatsToMessages
                  isServer={isServer}
                  variant="admin-table"
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
            messagesToFileStorageModuleFiles={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <MessagesToFileStorageModuleFiles
                  isServer={isServer}
                  variant="admin-table"
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
      }}
    />
  );
}
