import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as WidgetsToForms } from "@sps/crm/relations/widgets-to-forms/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="crm"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.data.className)}
    >
      <WidgetsToForms
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
              <WidgetsToForms
                key={index}
                isServer={props.isServer}
                variant={entity.variant as any}
                data={entity}
              />
            );
          });
        }}
      </WidgetsToForms>
    </div>
  );
}
