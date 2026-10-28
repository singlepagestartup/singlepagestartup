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
      className={cn(
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
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
            orderBy: {
              and: [
                { column: "orderIndex", method: "asc" },
                { column: "id", method: "asc" },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data
            ?.toSorted(
              (a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
            )
            .map((entity) => (
              <WidgetsToExternalWidgets
                key={entity.id}
                isServer={props.isServer}
                variant={entity.variant as any}
                dataSource="props"
                data={entity}
                url={props.url}
                language={props.language}
              />
            ));
        }}
      </WidgetsToExternalWidgets>
    </div>
  );
}
