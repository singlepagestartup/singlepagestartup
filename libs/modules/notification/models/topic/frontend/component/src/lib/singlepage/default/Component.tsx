import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="notification"
      data-model="notification"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <p className="font-bold">Generated variant</p>
      <p className="font-bold text-4xl">Model: notification</p>
      <p className="font-bold text-4xl">Variant: default</p>
    </div>
  );
}
