import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-utils-client";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="sps-crm"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full py-10 text-center flex flex-col gap-1")}
    >
      <p className="font-bold">Generated variant</p>
      <p className="font-bold text-4xl">Model: widget</p>
      <p className="font-bold text-4xl">Variant: default</p>
    </div>
  );
}
