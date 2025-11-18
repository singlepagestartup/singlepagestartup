import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-relation="subjects-to-acts"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
    >
      <p className="font-bold">Generated variant</p>
      <p className="font-bold text-4xl">Relation: subjects-to-acts</p>
      <p className="font-bold text-4xl">Variant: default</p>
    </div>
  );
}
