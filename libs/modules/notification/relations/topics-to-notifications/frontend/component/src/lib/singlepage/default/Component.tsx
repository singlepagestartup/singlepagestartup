import { IComponentPropsExtended } from "./interface";
import { Component as Notification } from "@sps/notification/models/notification/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="notification"
      data-relation="topics-to-notifications"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className, props.className)}
    >
      <Notification
        variant="find"
        isServer={props.isServer}
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.notificationId,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <Notification
                key={index}
                isServer={props.isServer}
                variant={entity.variant as any}
                data={entity}
              />
            );
          });
        }}
      </Notification>
    </div>
  );
}
