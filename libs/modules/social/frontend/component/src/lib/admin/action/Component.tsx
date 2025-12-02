"use client";

import { Component as ParentComponent } from "@sps/social/models/action/frontend/component";
import { Component as ProfilesToActions } from "@sps/social/relations/profiles-to-actions/frontend/component";
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
            profilesToActions={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ProfilesToActions
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "actionId",
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
                            column: "actionId",
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
