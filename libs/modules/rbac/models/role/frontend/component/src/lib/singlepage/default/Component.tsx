import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="role"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("flex flex-col", props.className)}
    >
      <p className="text-xs">{props.data.title}</p>
    </div>
  );
}
