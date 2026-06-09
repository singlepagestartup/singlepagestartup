import { IComponentPropsExtended } from "./interface";
import { Component as Action } from "@sps/social/models/action/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="social"
      data-relation="threads-to-actions"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
    >
      <Action
        variant="find"
        isServer={props.isServer}
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.actionId,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <Action
                key={index}
                isServer={props.isServer}
                variant="default"
                data={entity}
                language={props.language}
              />
            );
          });
        }}
      </Action>
    </div>
  );
}
