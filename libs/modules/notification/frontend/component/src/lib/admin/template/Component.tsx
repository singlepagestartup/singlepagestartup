"use client";

import { Component as ParentComponent } from "@sps/notification/models/template/frontend/component";
import { Component as NotificationsToTemplates } from "@sps/notification/relations/notifications-to-templates/frontend/component";

export function Component() {
  return (
    <ParentComponent
      hostUrl="/"
      isServer={false}
      variant="admin-table"
      adminForm={(props) => {
        return (
          <ParentComponent
            isServer={false}
            hostUrl={props.hostUrl}
            data={props.data}
            variant="admin-form"
            notificationsToTemplates={({ data, hostUrl, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <NotificationsToTemplates
                  isServer={isServer}
                  hostUrl={hostUrl}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "templateId",
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
