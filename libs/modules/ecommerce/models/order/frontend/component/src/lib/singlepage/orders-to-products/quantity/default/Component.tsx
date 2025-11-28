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
      <OrdersToProducts
        isServer={false}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "orderId",
                  method: "eq",
                  value: props.data.id,
                },
              ],
            },
          },
        }}
      >
        {({ data: ordersToProducts }) => {
          // return ordersToProducts?.reduce(
          //   (acc, entity) => acc + entity.quantity,
          //   0,
          // );
          return ordersToProducts?.map((entity, index) => {
            return (
              <OrdersToProducts
                key={index}
                isServer={false}
                variant="amount"
                data={entity}
              >
                {({ data }) => {
                  return <p>{data}</p>;
                }}
              </OrdersToProducts>
            );
          });
        }}
      </OrdersToProducts>
    </div>
  );
}
