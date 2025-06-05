import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="ecommerce"
      data-model="attribute"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.className)}
    >
      <p>
        {props.field === "string"
          ? props.data[props.field]?.[props.language]
          : props.data[props.field]}
      </p>
    </div>
  );
}
