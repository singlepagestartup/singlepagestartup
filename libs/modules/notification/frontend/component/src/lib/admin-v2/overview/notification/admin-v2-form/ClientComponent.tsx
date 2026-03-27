"use client";

import { Component as ParentComponent } from "@sps/notification/models/notification/frontend/component";
import { Component as NotificationsToTemplates } from "@sps/notification/relations/notifications-to-templates/frontend/component";
import { Component as TopicsToNotifications } from "@sps/notification/relations/topics-to-notifications/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Notification } from "../";
import { Component as Template } from "../../template";
import { Component as Topic } from "../../topic";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      topicsToNotifications={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <TopicsToNotifications
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Topic"
            rightModelAdminFormLabel="Notification"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Topic
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.topicId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
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
}
