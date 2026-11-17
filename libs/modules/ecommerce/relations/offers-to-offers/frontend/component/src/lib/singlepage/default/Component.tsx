import { IComponentPropsExtended } from "./interface";
import { Component as TargetOffer } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(
  props: Omit<IComponentPropsExtended, "variant"> & {
    variant: "default" | "delivery" | "add-on" | "fulfilled-by";
  },
) {
  return (
    <div
      data-module="ecommerce"
      data-relation="offers-to-offers"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className, props.className)}
    >
      <TargetOffer
        variant="find"
        isServer={props.isServer}
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.targetOfferId,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity) => {
            return (
              <TargetOffer
                key={entity.id}
                isServer={props.isServer}
                variant={entity.variant as any}
                data={entity}
                language={props.language}
              />
            );
          });
        }}
      </TargetOffer>
    </div>
  );
}
