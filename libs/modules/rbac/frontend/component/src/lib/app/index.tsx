import { IComponentProps } from "./interface";
import { Component as Widget } from "@sps/rbac/models/widget/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";

export function App(props: IComponentProps) {
  return (
    <div
      data-module="rbac"
      className={cn("flex w-full", props.className || "")}
    >
      <Widget
        isServer={props.isServer}
        variant="default"
        data={{
          id: props.widgetId,
        }}
      />
    </div>
  );
}
