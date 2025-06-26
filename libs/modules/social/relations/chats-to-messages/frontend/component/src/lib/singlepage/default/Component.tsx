import { IComponentPropsExtended } from "./interface";
import { Component as Message } from "@sps/social/models/chat/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="social"
      data-relation="chats-to-messages"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
    >
      <Message
        variant="find"
        isServer={props.isServer}
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.messageId,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <Message
                key={index}
                isServer={props.isServer}
                variant="default"
                data={entity}
                language={props.language}
              />
            );
          });
        }}
      </Message>
    </div>
  );
}
