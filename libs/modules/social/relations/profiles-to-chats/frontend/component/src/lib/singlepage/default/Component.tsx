import { IComponentPropsExtended } from "./interface";
import { Component as Chat } from "@sps/social/models/chat/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="social"
      data-relation="profiles-to-chats"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
    >
      <Chat
        variant="find"
        isServer={props.isServer}
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.chatId,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <Chat
                key={index}
                isServer={props.isServer}
                variant="default"
                data={entity}
                language={props.language}
              />
            );
          });
        }}
      </Chat>
    </div>
  );
}
