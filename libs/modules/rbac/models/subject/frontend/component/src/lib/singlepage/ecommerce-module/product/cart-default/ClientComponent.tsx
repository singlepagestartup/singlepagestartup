"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as EcommerceModuleOrderListDefault } from "../../order/list/default";
import { Component as EcommerceModuleOrderListOrdersToProductsDefault } from "../../order/list/orders-to-products-default";
import { Component as OrderCreateDefault } from "../../order/create-default/Component";
import { Component as OrderUpdateDefault } from "../../order/update-default/Component";
import { Component as OrderDeleteDefault } from "../../order/delete-default/Component";
import { Component as OrderCheckoutDefault } from "../../order/checkout-default/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <EcommerceModuleOrderListDefault
        isServer={false}
        variant="ecommerce-module-order-list-default"
        data={props.data}
        language={props.language}
      >
        {({ data: ecommerceModuleOrders }) => {
          if (!ecommerceModuleOrders?.length) {
            return (
              <OrderCreateDefault
                isServer={false}
                variant="ecommerce-module-order-create-default"
                language={props.language}
                data={props.data}
                product={props.product}
                store={props.store}
              />
            );
          }

          return (
            <EcommerceModuleOrderListOrdersToProductsDefault
              isServer={false}
              variant="ecommerce-module-order-list-orders-to-products-default"
              data={props.data}
              language={props.language}
              apiProps={{
                params: {
                  filters: {
                    and: [
                      {
                        column: "productId",
                        method: "eq",
                        value: props.product.id,
                      },
                    ],
                  },
                },
              }}
            >
              {({ data: ecommerceModuleOrdersToProducts }) => {
                const cartOrdersToProducts =
                  ecommerceModuleOrdersToProducts.filter(
                    (ecommerceModuleOrderToProduct) => {
                      return ecommerceModuleOrders.find(
                        (ecommerceModuleOrder) => {
                          return (
                            ecommerceModuleOrder.id ===
                            ecommerceModuleOrderToProduct.orderId
                          );
                        },
                      );
                    },
                  );

                if (!cartOrdersToProducts.length) {
                  return (
                    <OrderCreateDefault
                      isServer={false}
                      variant="ecommerce-module-order-create-default"
                      language={props.language}
                      data={props.data}
                      product={props.product}
                      store={props.store}
                    />
                  );
                }

                return cartOrdersToProducts.map(
                  (ecommerceModuleOrderToProduct) => {
                    const ecommerceModuleOrder = ecommerceModuleOrders.find(
                      (ecommerceModuleOrder) => {
                        return (
                          ecommerceModuleOrder.id ===
                          ecommerceModuleOrderToProduct.orderId
                        );
                      },
                    );

                    if (!ecommerceModuleOrder) {
                      return;
                    }

                    return (
                      <div
                        key={ecommerceModuleOrderToProduct.id}
                        className="flex flex-col gap-2"
                      >
                        <OrderUpdateDefault
                          isServer={false}
                          variant="ecommerce-module-order-update-default"
                          order={ecommerceModuleOrder}
                          data={props.data}
                          language={props.language}
                        />
                        <OrderDeleteDefault
                          isServer={false}
                          variant="ecommerce-module-order-delete-default"
                          order={ecommerceModuleOrder}
                          data={props.data}
                          language={props.language}
                        />
                        <OrderCheckoutDefault
                          isServer={false}
                          variant="ecommerce-module-order-checkout-default"
                          product={props.product}
                          order={ecommerceModuleOrder}
                          data={props.data}
                          language={props.language}
                        />
                      </div>
                    );
                  },
                );
              }}
            </EcommerceModuleOrderListOrdersToProductsDefault>
          );
        }}
      </EcommerceModuleOrderListDefault>
    </div>
  );
}
