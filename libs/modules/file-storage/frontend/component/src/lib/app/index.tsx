import { IComponentProps } from "./interface";
import { Component as Widget } from "@sps/file-storage/models/widget/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";

export function App(props: IComponentProps) {
  return (
    <div className={cn("w-full flex", props.className)}>
      <Widget isServer={props.isServer} variant="default" data={props.data} />
    </div>
  );
}
