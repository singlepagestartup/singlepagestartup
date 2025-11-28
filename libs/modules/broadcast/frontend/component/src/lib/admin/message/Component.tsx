"use client";

import { Component as ParentComponent } from "@sps/broadcast/models/message/frontend/component";
import { Component as ChannelsToMessages } from "@sps/broadcast/relations/channels-to-messages/frontend/component";

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
            channelsToMessages={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ChannelsToMessages
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
