import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="ecommerce"
      data-model="order"
      data-variant={props.variant}
      className={cn("w-full flex flex-row gap-3", props.className)}
    >
      <p className="text-sm font-bold">{props.data}</p>
    </div>
  );
}
