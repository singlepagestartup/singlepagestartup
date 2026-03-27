"use client";

import { Component as ParentComponent } from "@sps/notification/models/template/frontend/component";
import { Component as NotificationsToTemplates } from "@sps/notification/relations/notifications-to-templates/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Notification } from "../../notification";
import { Component as Template } from "../";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      notificationsToTemplates={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <NotificationsToTemplates
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Notification"
            rightModelAdminFormLabel="Template"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Notification
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.notificationId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Template
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.templateId } as any}
                />
              );
            }}
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
}
