import { IComponentPropsExtended } from "./interface";
import { Component as WidgetsToFiles } from "@sps/sps-file-storage/relations/widgets-to-files/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="sps-file-storage"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className="w-full flex"
    >
      <WidgetsToFiles
        isServer={props.isServer}
        hostUrl={props.hostUrl}
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
                hostUrl={props.hostUrl}
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