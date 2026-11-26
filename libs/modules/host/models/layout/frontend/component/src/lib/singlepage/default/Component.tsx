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
      <div
        className={cn(
          "w-full min-w-0 flex-1 pb-12",
          "group-[&]/social-chat-layout:mx-auto group-[&]/social-chat-layout:min-h-0 group-[&]/social-chat-layout:max-w-7xl group-[&]/social-chat-layout:[container-type:size]",
          "group-[&]/social-chat-layout:px-4 group-[&]/social-chat-layout:py-3 sm:group-[&]/social-chat-layout:px-6 lg:group-[&]/social-chat-layout:px-8",
        )}
      >
        {props.children}
      </div>
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
