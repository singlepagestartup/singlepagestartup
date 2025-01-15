import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Widget } from "@sps/host/models/widget/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="host"
      data-relation="layouts-to-widgets"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.data.className)}
    >
      <Widget
        isServer={props.isServer}
        hostUrl={props.hostUrl}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.widgetId,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <Widget
                key={index}
                isServer={props.isServer}
                hostUrl={props.hostUrl}
                variant={entity.variant as any}
                data={entity}
              />
            );
          });
        }}
      </Widget>
    </div>
  );
}
