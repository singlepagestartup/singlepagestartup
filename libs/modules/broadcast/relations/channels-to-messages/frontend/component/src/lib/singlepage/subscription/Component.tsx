import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="broadcast"
      data-model="channels-to-messages"
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <p className="font-bold">Generated variant</p>
      <p className="font-bold text-4xl">Model: channels-to-messages</p>
      <p className="font-bold text-4xl">Variant: subscription</p>
    </div>
  );
}
