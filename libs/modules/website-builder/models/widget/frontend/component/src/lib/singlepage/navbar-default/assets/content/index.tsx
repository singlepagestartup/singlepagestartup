import { IComponentPropsExtended } from "../../interface";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div className="flex min-w-0 w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between [&_[data-relation=widgets-to-buttons-arrays]]:w-auto [&_[data-model=buttons-array]]:w-auto [&_[data-model=buttons-array]]:gap-1 [&_[data-relation=buttons-arrays-to-buttons]]:w-auto [&_[data-model=button]]:min-h-11 [&_[data-model=button]]:w-full [&_[data-model=button]]:justify-start [&_[data-model=button]]:rounded-xl [&_[data-model=button]]:border-0 [&_[data-model=button]]:bg-transparent [&_[data-model=button]]:px-3 [&_[data-model=button]]:py-2 [&_[data-model=button]]:text-sm [&_[data-model=button]]:font-medium [&_[data-model=button]]:text-muted-foreground [&_[data-model=button]]:no-underline [&_[data-model=button]]:shadow-none [&_[data-model=button]]:transition [&_[data-model=button]:hover]:bg-muted [&_[data-model=button]:hover]:text-foreground [&_[data-model=button]:focus-visible]:outline-2 [&_[data-model=button]:focus-visible]:outline-offset-2 [&_[data-model=button]:focus-visible]:outline-foreground [&_[data-model=button][aria-current=page]]:bg-muted [&_[data-model=button][aria-current=page]]:text-foreground lg:[&_[data-model=button]]:w-auto lg:[&_[data-model=button]]:justify-center">
      <div className="flex min-w-0 flex-col gap-1 lg:flex-row lg:flex-wrap lg:items-center [&_[data-model=buttons-array]]:flex-col lg:[&_[data-model=buttons-array]]:flex-row">
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
