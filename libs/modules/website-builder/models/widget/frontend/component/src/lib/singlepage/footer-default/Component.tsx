import { IComponentPropsExtended } from "./interface";
import { Component as WidgetsToLogotypes } from "@sps/website-builder/relations/widgets-to-logotypes/frontend/component";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="website-builder"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full border-t border-border bg-background text-foreground",
        "py-8",
        props.data.className,
        props.className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_2fr]">
          <div className="flex min-w-0 flex-col gap-4">
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
                        variant={entity.variant as any}
                        isServer={props.isServer}
                        data={entity}
                        language={props.language}
                      />
                    );
                  });
              }}
            </WidgetsToLogotypes>
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
          <div className="grid min-w-0 gap-6 sm:grid-cols-3">
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
        </div>
        <div className="h-px w-full bg-border"></div>
        <div className="flex flex-col items-start justify-between gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <div className="flex items-center flex-wrap gap-4">
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
                        value: "extra",
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
      </div>
    </div>
  );
}
