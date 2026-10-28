import { IActionsViewProps } from "./interface";
import { Component as ButtonsArraysToButtons } from "@sps/website-builder/relations/buttons-arrays-to-buttons/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IActionsViewProps) {
  return (
    <div
      data-module="website-builder"
      data-model="buttons-array"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "flex max-w-full flex-wrap items-center gap-3",
        props.variant === "actions-full" ? "w-full" : "w-fit",
        props.variant === "navigation" &&
          "w-full flex-col items-stretch gap-1 lg:w-fit lg:flex-row lg:items-center",
        props.variant === "navigation-inline" && "gap-x-4 gap-y-1",
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
                  variant="default"
                  dataSource="props"
                  data={entity}
                  language={props.language}
                  className={
                    props.variant === "actions-full"
                      ? "w-full min-w-0"
                      : props.variant === "navigation"
                        ? "w-full lg:w-auto"
                        : "w-auto max-w-full"
                  }
                />
              );
            });
        }}
      </ButtonsArraysToButtons>
    </div>
  );
}
