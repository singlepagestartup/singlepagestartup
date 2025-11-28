import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="crm"
      data-model="input"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
    >
      <p className="font-bold">Generated variant</p>
      <p className="font-bold text-4xl">Model: input</p>
      <p className="font-bold text-4xl">Variant: default</p>
    </div>
  );
}
