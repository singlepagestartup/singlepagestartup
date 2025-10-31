import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Widget } from "@sps/website-builder/models/widget/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="ecommerce"
      data-relation="categories-to-website-builder-module-widgets"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <Widget
        variant="find"
        isServer={props.isServer}
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
                variant={entity.variant as any}
                data={entity}
                language={props.language}
              />
            );
          });
        }}
      </Widget>
    </div>
  );
}
