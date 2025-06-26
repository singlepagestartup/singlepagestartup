"use client";

import { Component as ParentComponent } from "@sps/social/models/chat/frontend/component";
import { Component as ProfilesToChats } from "@sps/social/relations/profiles-to-chats/frontend/component";
import { Component as ChatsToMessages } from "@sps/social/relations/chats-to-messages/frontend/component";

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
          />
        );
      }}
    />
  );
}
