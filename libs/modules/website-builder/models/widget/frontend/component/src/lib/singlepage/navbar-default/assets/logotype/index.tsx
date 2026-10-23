import { IComponentPropsExtended } from "../../interface";
import { Component as WidgetsToLogotypes } from "@sps/website-builder/relations/widgets-to-logotypes/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div className="min-w-0 w-fit max-w-full sm:max-w-48 [&_[data-model=logotype]]:max-w-full [&_[data-relation=logotypes-to-file-storage-module-files]]:max-w-full [&_[data-model=logotype]]:min-h-11 [&_[data-model=logotype]]:justify-center [&_[data-model=logotype]]:rounded-xl [&_[data-model=logotype]:focus-visible]:outline-2 [&_[data-model=logotype]:focus-visible]:outline-offset-2 [&_[data-model=logotype]:focus-visible]:outline-foreground [&_img]:max-h-8">
      <WidgetsToLogotypes
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
          return data
            ?.toSorted(
              (a, b) =>
                (a.orderIndex ?? 0) - (b.orderIndex ?? 0) ||
                a.id.localeCompare(b.id),
            )
            .map((entity) => {
              return (
                <WidgetsToLogotypes
                  key={entity.id}
                  isServer={props.isServer}
                  variant={entity.variant as any}
                  data={entity}
                  language={props.language}
                />
              );
            });
        }}
      </WidgetsToLogotypes>
    </div>
  );
}
