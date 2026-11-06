import { cn } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";
/** Preserve the original frame; stored copy remains editable without adding a new heading. */
export function Component(props: IComponentPropsExtended) {
  return (
    <div
      id={props.data.anchor || undefined}
      data-module="website-builder"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}
