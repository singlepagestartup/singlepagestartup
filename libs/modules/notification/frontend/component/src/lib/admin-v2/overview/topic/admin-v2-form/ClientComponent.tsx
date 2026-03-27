"use client";

import { Component as ParentComponent } from "@sps/notification/models/topic/frontend/component";
import { Component as TopicsToNotifications } from "@sps/notification/relations/topics-to-notifications/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Notification } from "../../notification";
import { Component as Topic } from "../";

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
}
