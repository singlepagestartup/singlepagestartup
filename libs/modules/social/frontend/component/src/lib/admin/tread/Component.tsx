"use client";

import { Component as ParentComponent } from "@sps/social/models/tread/frontend/component";
import { Component as TreadsToMessages } from "@sps/social/relations/treads-to-messages/frontend/component";
import { Component as ChatsToTreads } from "@sps/social/relations/chats-to-treads/frontend/component";

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
            treadsToMessages={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <TreadsToMessages
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "treadId",
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
            chatsToTreads={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ChatsToTreads
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "treadId",
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
