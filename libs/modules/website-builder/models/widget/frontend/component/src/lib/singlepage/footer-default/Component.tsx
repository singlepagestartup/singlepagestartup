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
        "w-full bg-white flex flex-col",
        props.data.className || "pb-4 pt-12 px-4 lg:pb-6 lg:pt-16 lg:px-2",
      )}
    >
      <div className="mx-auto w-full max-w-7xl flex flex-col gap-4">
        <div className="w-full flex flex-col lg:grid lg:grid-cols-4 justify-end gap-12">
          <div className="w-fit flex flex-col gap-2">
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
                return data?.map((entity, index) => {
                  return (
                    <WidgetsToLogotypes
                      key={index}
                      variant={entity.variant as any}
                      isServer={props.isServer}
                      data={entity}
                    />
                  );
                });
              }}
            </WidgetsToLogotypes>
            {props.data.subtitle ? (
              <p className="text-muted-foreground text-xs">
                {props.data.subtitle}
              </p>
            ) : null}
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
                return data?.map((entity, index) => {
                  return (
                    <WidgetsToButtonsArrays
                      key={index}
                      isServer={props.isServer}
                      variant={entity.variant as any}
                      data={entity}
                    />
                  );
                });
              }}
            </WidgetsToButtonsArrays>
          </div>
          <div className="flex flex-col col-span-2 col-start-3 lg:grid lg:grid-cols-3 gap-6">
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
                return data?.map((entity, index) => {
                  return (
                    <WidgetsToButtonsArrays
                      key={index}
                      isServer={props.isServer}
                      variant={entity.variant as any}
                      data={entity}
                    />
                  );
                });
              }}
            </WidgetsToButtonsArrays>
          </div>
        </div>
        <div className="w-full h-px bg-gray-400"></div>
        <div className="flex flex-col items-start lg:flex-row lg:items-center justify-between gap-4">
          <div>
            {props.data.description ? (
              <p className="text-muted-foreground text-xs">
                {props.data.description}
              </p>
            ) : null}
          </div>
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
                return data?.map((entity, index) => {
                  return (
                    <WidgetsToButtonsArrays
                      key={index}
                      isServer={props.isServer}
                      variant={entity.variant as any}
                      data={entity}
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
