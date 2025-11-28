"use client";

import { Component as ParentComponent } from "@sps/notification/models/topic/frontend/component";
import { Component as TopicsToNotifications } from "@sps/notification/relations/topics-to-notifications/frontend/component";

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
            topicsToNotifications={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <TopicsToNotifications
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "topicId",
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
