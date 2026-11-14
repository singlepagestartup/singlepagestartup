import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";
import { Component as Message } from "@sps/broadcast/models/message/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="broadcast"
      data-relation="channels-to-messages"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className, props.className)}
    >
      <Message
        isServer={props.isServer}
        dataSource="props"
        data={props.message}
        variant={props.message.variant as "default"}
      />
    </div>
  );
}
