import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as ButtonsArrays } from "@sps/website-builder/models/buttons-array/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="website-builder"
      data-relation="slides-to-buttons-arrays"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className)}
    >
      <ButtonsArrays
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.buttonsArrayId,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <ButtonsArrays
                key={index}
                isServer={props.isServer}
                variant={entity.variant as any}
                data={entity}
                language={props.language}
              />
            );
          });
        }}
      </ButtonsArrays>
    </div>
  );
}
