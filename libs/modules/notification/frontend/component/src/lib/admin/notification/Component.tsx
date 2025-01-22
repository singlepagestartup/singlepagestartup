"use client";

import { Component as ParentComponent } from "@sps/notification/models/notification/frontend/component";
import { Component as TopicsToNotifications } from "@sps/notification/relations/topics-to-notifications/frontend/component";
import { Component as NotificationsToTemplates } from "@sps/notification/relations/notifications-to-templates/frontend/component";

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
                            column: "notificationId",
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
            notificationsToTemplates={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <NotificationsToTemplates
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "notificationId",
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
