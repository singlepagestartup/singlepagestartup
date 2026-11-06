import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as OrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="ecommerce"
      data-model="order"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      {props.ordersToProducts.map((entity) => {
        return (
          <OrdersToProducts
            key={entity.id}
            isServer={false}
            variant="amount"
            data={entity}
          >
            {({ data }) => {
              return <p>{data}</p>;
            }}
          </OrdersToProducts>
        );
      })}
    </div>
  );
}
