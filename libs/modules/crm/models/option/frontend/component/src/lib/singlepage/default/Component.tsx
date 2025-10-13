import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="crm"
      data-model="option"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <p className="font-bold">Generated variant</p>
      <p className="font-bold text-4xl">Module: crm</p>
      <p className="font-bold text-3xl">Model: option</p>
      <p className="font-bold text-xl">Variant: {props.variant}</p>
    </div>
  );
}
