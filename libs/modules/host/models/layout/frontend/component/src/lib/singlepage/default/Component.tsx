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
      className={cn(
        "flex min-h-screen w-full min-w-0 flex-col bg-muted text-foreground",
        props.data.className,
        props.className,
      )}
    >
      {props.before === undefined ? (
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
            return data?.map((entity) => {
              return (
                <LayoutsToWidgets
                  key={entity.id}
                  isServer={props.isServer}
                  variant={entity.variant as any}
                  data={entity}
                  language={props.language}
                />
              );
            });
          }}
        </LayoutsToWidgets>
      ) : (
        props.before
      )}
      <div className="min-w-0 w-full flex-1 pb-12">{props.children}</div>
      {props.after === undefined ? (
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
            return data?.map((entity) => {
              return (
                <LayoutsToWidgets
                  key={entity.id}
                  isServer={props.isServer}
                  variant="default"
                  data={entity}
                  language={props.language}
                />
              );
            });
          }}
        </LayoutsToWidgets>
      ) : (
        props.after
      )}
    </div>
  );
}
