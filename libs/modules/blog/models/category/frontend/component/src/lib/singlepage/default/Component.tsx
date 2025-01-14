import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="startup"
      data-model="category"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className)}
    >
      <p className="font-bold">Generated variant</p>
      <p className="font-bold text-4xl">Model: category</p>
      <p className="font-bold text-4xl">Variant: default</p>
    </div>
  );
}
