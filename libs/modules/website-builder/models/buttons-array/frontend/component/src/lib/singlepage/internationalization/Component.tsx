import { cn } from "@sps/shared-frontend-client-utils";
import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      id={props.data.id}
      language={props.language}
      label={props.data.title?.[props.language]}
      className={cn(props.data.className, props.className)}
    />
  );
}
