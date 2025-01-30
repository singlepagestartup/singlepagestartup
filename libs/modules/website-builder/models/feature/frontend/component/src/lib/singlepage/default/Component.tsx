import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="website-builder"
      data-model="elements.feature"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("flex flex-col", props.data.className)}
    >
      {props.data.title?.[props.language] ? (
        <p className="text-3xl font-medium leading-6 text-gray-900">
          {props.data.title[props.language]}
        </p>
      ) : null}
      {props.data?.description?.[props.language] ? (
        <p className="text-base text-gray-500">
          {props.data?.description[props.language]}
        </p>
      ) : null}
    </div>
  );
}
