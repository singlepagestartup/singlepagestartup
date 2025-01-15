import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="website-builder"
      data-model="button"
      data-variant={props.variant}
      className={cn("w-full py-10 text-center flex flex-col gap-1")}
    >
      <p className="font-bold">Generated variant</p>
      <p className="font-bold text-4xl">Model: button</p>
      <p className="font-bold text-4xl">Variant: find</p>
    </div>
  );
}
