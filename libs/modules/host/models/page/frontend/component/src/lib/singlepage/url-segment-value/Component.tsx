import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="host"
      data-model="page"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
    >
      <p className="font-bold">Generated variant</p>
      <p className="font-bold text-4xl">Model: page</p>
      <p className="font-bold text-4xl">Variant: url-segment-value</p>
    </div>
  );
}
