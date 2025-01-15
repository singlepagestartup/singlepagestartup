"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as ChannelsToMessages } from "@sps/broadcast/relations/channels-to-messages/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="broadcast"
      data-model="channel"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("flex-col gap-2 mx-auto w-full border hidden")}
    >
      <ChannelsToMessages
        hostUrl={props.hostUrl}
        isServer={false}
        variant="subscription"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "channelId",
                  method: "eq",
                  value: props.data.id,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <ChannelsToMessages
                key={index}
                hostUrl={props.hostUrl}
                isServer={false}
                data={entity}
                variant={entity.variant as any}
              />
            );
          });
        }}
      </ChannelsToMessages>
    </div>
  );
}
