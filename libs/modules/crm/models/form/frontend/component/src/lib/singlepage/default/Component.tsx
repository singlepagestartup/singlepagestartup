import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="crm"
      data-model="form"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "flex w-full min-w-0 flex-col gap-5",
        props.data.className,
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}
