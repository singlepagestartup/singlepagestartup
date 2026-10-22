import { IComponentPropsExtended } from "../../interface";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div className="flex min-w-0 w-full flex-col justify-between gap-4 lg:flex-row lg:items-center">
      <div className="flex flex-wrap items-center gap-2">
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
                    variant={entity.variant as any}
                    data={entity}
                    language={props.language}
                  />
                );
              });
          }}
        </WidgetsToButtonsArrays>
      </div>
      <div className="flex flex-wrap items-center gap-2">
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
                    variant={entity.variant as any}
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
