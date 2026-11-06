import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="ecommerce"
      data-model="attribute-key"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "min-w-0 break-words text-muted-foreground",
        props.className,
      )}
    >
      <p className="font-normal">{props.data.title?.[props.language]}</p>
    </div>
  );
}
