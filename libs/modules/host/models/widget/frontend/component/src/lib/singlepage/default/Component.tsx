import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as WidgetsToExternalWidgets } from "@sps/host/relations/widgets-to-external-widgets/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="host"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.data.className || "")}
    >
      <WidgetsToExternalWidgets
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "widgetId",
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
              <WidgetsToExternalWidgets
                key={index}
                isServer={props.isServer}
                variant={entity.variant as any}
                data={entity}
                url={props.url}
                language={props.language}
              />
            );
          });
        }}
      </WidgetsToExternalWidgets>
    </div>
  );
}
