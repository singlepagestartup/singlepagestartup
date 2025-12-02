"use client";

import { Component as ParentComponent } from "@sps/social/models/chat/frontend/component";
import { Component as ProfilesToChats } from "@sps/social/relations/profiles-to-chats/frontend/component";
import { Component as ChatsToMessages } from "@sps/social/relations/chats-to-messages/frontend/component";
import { Component as ChatsToThreads } from "@sps/social/relations/chats-to-threads/frontend/component";
import { Component as ChatsToActions } from "@sps/social/relations/chats-to-actions/frontend/component";

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
            profilesToChats={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ProfilesToChats
                  isServer={isServer}
                  variant="admin-table"
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
            chatsToThreads={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ChatsToThreads
                  isServer={isServer}
                  variant="admin-table"
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
            chatsToActions={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ChatsToActions
                  isServer={isServer}
                  variant="admin-table"
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
      }}
    />
  );
}
