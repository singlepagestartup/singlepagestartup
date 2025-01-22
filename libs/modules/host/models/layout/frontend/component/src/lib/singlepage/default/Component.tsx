import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as LayoutsToWidgets } from "@sps/host/relations/layouts-to-widgets/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="host"
      data-model="layout"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.data.className)}
    >
      <LayoutsToWidgets
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "layoutId",
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
              <LayoutsToWidgets
                key={index}
                isServer={props.isServer}
                variant={entity.variant as any}
                data={entity}
              />
            );
          });
        }}
      </LayoutsToWidgets>
      {props.children}
      <LayoutsToWidgets
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "layoutId",
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
              <LayoutsToWidgets
                key={index}
                isServer={props.isServer}
                variant="default"
                data={entity}
              />
            );
          });
        }}
      </LayoutsToWidgets>
    </div>
  );
}
