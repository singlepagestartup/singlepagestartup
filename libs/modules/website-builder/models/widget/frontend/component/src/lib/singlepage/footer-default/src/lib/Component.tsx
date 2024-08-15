import { IComponentPropsExtended } from "./interface";
import { Component as FooterBlocksToLogotypes } from "@sps/website-builder/relations/widgets-to-logotypes/frontend/component";
import { Component as FooterBlocksToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
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
            <FooterBlocksToLogotypes
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
                    <FooterBlocksToLogotypes
                      key={index}
                      variant={entity.variant as any}
                      isServer={props.isServer}
                      hostUrl={props.hostUrl}
                      data={entity}
                    />
                  );
                });
              }}
            </FooterBlocksToLogotypes>
            {props.data.subtitle ? (
              <p className="text-muted-foreground text-xs">
                {props.data.subtitle}
              </p>
            ) : null}
            <FooterBlocksToButtonsArrays
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
                      {
                        column: "position",
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
                    <FooterBlocksToButtonsArrays
                      key={index}
                      isServer={props.isServer}
                      hostUrl={props.hostUrl}
                      variant={entity.variant as any}
                      data={entity}
                    />
                  );
                });
              }}
            </FooterBlocksToButtonsArrays>
          </div>
          <div className="flex flex-col col-span-2 col-start-3 lg:grid lg:grid-cols-3 gap-6">
            <FooterBlocksToButtonsArrays
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
                      {
                        column: "position",
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
                    <FooterBlocksToButtonsArrays
                      key={index}
                      isServer={props.isServer}
                      hostUrl={props.hostUrl}
                      variant={entity.variant as any}
                      data={entity}
                    />
                  );
                });
              }}
            </FooterBlocksToButtonsArrays>
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
            <FooterBlocksToButtonsArrays
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
                      {
                        column: "position",
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
                    <FooterBlocksToButtonsArrays
                      key={index}
                      isServer={props.isServer}
                      hostUrl={props.hostUrl}
                      variant={entity.variant as any}
                      data={entity}
                    />
                  );
                });
              }}
            </FooterBlocksToButtonsArrays>
          </div>
        </div>
      </div>
    </div>
  );
}
