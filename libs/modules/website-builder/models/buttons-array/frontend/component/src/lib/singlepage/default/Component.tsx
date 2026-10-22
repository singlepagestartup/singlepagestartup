import { IComponentPropsExtended } from "./interface";
import { Component as ButtonsArraysToButtons } from "@sps/website-builder/relations/buttons-arrays-to-buttons/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="website-builder"
      data-model="buttons-array"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "flex w-full flex-wrap items-center gap-3",
        props.data.className,
        props.className,
      )}
    >
      <ButtonsArraysToButtons
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "buttonsArrayId",
                  method: "eq",
                  value: props.data.id,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data
            ?.toSorted(
              (a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
            )
            .map((entity) => {
              return (
                <ButtonsArraysToButtons
                  key={entity.id}
                  isServer={props.isServer}
                  variant={entity.variant as any}
                  data={entity}
                  language={props.language}
                />
              );
            });
        }}
      </ButtonsArraysToButtons>
    </div>
  );
}
