"use client";

import { Component as ParentComponent } from "@sps/broadcast/models/channel/frontend/component";
import { Component as ChannelsToMessages } from "@sps/broadcast/relations/channels-to-messages/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Channel } from "../";
import { Component as Message } from "../../message";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      channelsToMessages={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ChannelsToMessages
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Channel"
            rightModelAdminFormLabel="Message"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Channel
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.channelId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Message
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.messageId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "channelId",
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
