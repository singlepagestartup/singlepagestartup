import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";
import { Component as Topic } from "@sps/notification/models/topic/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-relation="subjects-to-notification-module-topics"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col gap-1", props.className)}
    >
      <Topic
        variant="find"
        isServer={props.isServer}
        hostUrl={props.hostUrl}
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.notificationModuleTopicId,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <Topic
                key={index}
                isServer={props.isServer}
                hostUrl={props.hostUrl}
                variant={entity.variant as any}
                data={entity}
              />
            );
          });
        }}
      </Topic>
    </div>
  );
}
