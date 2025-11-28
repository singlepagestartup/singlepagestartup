import { Button } from "@sps/shared-ui-shadcn";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <Button
      data-module="social"
      data-model="profile"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full", props.data.className, props.className)}
      variant="outline"
      size="sm"
    >
      {props.data.title?.[props.language]}
    </Button>
  );
}
