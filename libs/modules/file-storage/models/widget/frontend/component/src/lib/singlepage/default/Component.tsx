import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";
import { Component as WidgetsToFiles } from "@sps/file-storage/relations/widgets-to-files/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="file-storage"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.className)}
    >
      <WidgetsToFiles
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
              <WidgetsToFiles
                key={index}
                isServer={props.isServer}
                data={entity}
                variant={entity.variant as any}
              />
            );
          });
        }}
      </WidgetsToFiles>
    </div>
  );
}
