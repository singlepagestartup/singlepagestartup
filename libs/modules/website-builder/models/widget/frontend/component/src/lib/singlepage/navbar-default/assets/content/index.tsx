import { IComponentPropsExtended } from "../../interface";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div className="flex min-w-0 w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-col gap-1 lg:flex-row lg:flex-wrap lg:items-center">
        <WidgetsToButtonsArrays
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
                  {
                    column: "variant",
                    method: "eq",
                    value: "default",
                  },
                ],
              },
            },
          }}
        >
          {({ data }) => {
            return data
              ?.toSorted(
                (a, b) =>
                  (a.orderIndex ?? 0) - (b.orderIndex ?? 0) ||
                  a.id.localeCompare(b.id),
              )
              .map((entity) => {
                return (
                  <WidgetsToButtonsArrays
                    key={entity.id}
                    isServer={props.isServer}
                    variant="default"
                    className="w-auto max-w-full"
                    dataSource="props"
                    data={entity}
                    language={props.language}
                  />
                );
              });
          }}
        </WidgetsToButtonsArrays>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1">
        <WidgetsToButtonsArrays
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
                  {
                    column: "variant",
                    method: "eq",
                    value: "additional",
                  },
                ],
              },
            },
          }}
        >
          {({ data }) => {
            return data
              ?.toSorted(
                (a, b) =>
                  (a.orderIndex ?? 0) - (b.orderIndex ?? 0) ||
                  a.id.localeCompare(b.id),
              )
              .map((entity) => {
                return (
                  <WidgetsToButtonsArrays
                    key={entity.id}
                    isServer={props.isServer}
                    variant="default"
                    className="w-auto max-w-full"
                    dataSource="props"
                    data={entity}
                    language={props.language}
                  />
                );
              });
          }}
        </WidgetsToButtonsArrays>
      </div>
    </div>
  );
}
