import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="knowledge"
      data-model="chunk"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <p className="font-bold">Generated variant</p>
      <p className="font-bold text-4xl">Module: knowledge</p>
      <p className="font-bold text-3xl">Model: chunk</p>
      <p className="font-bold text-xl">Variant: {props.variant}</p>
    </div>
  );
}
