"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as EcommerceModuleOrderListDefault } from "../../order/list/default";
import { Component as EcommerceOrder } from "@sps/ecommerce/models/order/frontend/component";
import { Component as EcommerceOrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/frontend/component";
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
          if (!ecommerceModuleOrders) {
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
            <EcommerceOrder
              isServer={false}
              variant="find"
              apiProps={{
                params: {
                  filters: {
                    and: [
                      {
                        column: "id",
                        method: "inArray",
                        value: ecommerceModuleOrders?.map(
                          (entity) => entity.id,
                        ),
                      },
                      {
                        column: "type",
                        method: "eq",
                        value: "cart",
                      },
                    ],
                  },
                },
              }}
            >
              {({ data }) => {
                if (!data || !data?.length) {
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
                  <EcommerceOrdersToProducts
                    isServer={false}
                    variant="find"
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
                      options: {
                        headers: {
                          "Cache-Control": "no-store",
                        },
                      },
                    }}
                  >
                    {({ data: ordersWithCurrentProduct }) => {
                      if (
                        !ordersWithCurrentProduct ||
                        !ordersWithCurrentProduct?.length
                      ) {
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

                      const cartOrdersWithCurrentProduct =
                        ordersWithCurrentProduct.filter(
                          (ordersWithCurrentProduct) => {
                            return data.find((order) => {
                              return (
                                order.id === ordersWithCurrentProduct.orderId
                              );
                            });
                          },
                        );

                      if (!cartOrdersWithCurrentProduct.length) {
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

                      return data?.map((order, index) => {
                        return (
                          <EcommerceOrdersToProducts
                            key={index}
                            isServer={false}
                            variant="find"
                            apiProps={{
                              params: {
                                filters: {
                                  and: [
                                    {
                                      column: "orderId",
                                      method: "eq",
                                      value: order.id,
                                    },
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
                            {({ data: ordersWithCurrentProduct }) => {
                              if (!ordersWithCurrentProduct?.length) {
                                return;
                              }

                              return ordersWithCurrentProduct
                                .filter((ordersWithCurrentProduct) => {
                                  return ecommerceModuleOrders.find(
                                    (ecommerceModuleOrder) => {
                                      return (
                                        ecommerceModuleOrder.id ===
                                        ordersWithCurrentProduct.orderId
                                      );
                                    },
                                  );
                                })
                                .map((orderToProduct, index) => {
                                  const ecommerceModuleOrder =
                                    ecommerceModuleOrders.find(
                                      (ecommerceModuleOrder) => {
                                        return (
                                          ecommerceModuleOrder.id ===
                                          orderToProduct.orderId
                                        );
                                      },
                                    );

                                  if (!ecommerceModuleOrder) {
                                    return;
                                  }

                                  return (
                                    <div
                                      key={index}
                                      className="flex flex-col gap-2"
                                    >
                                      <OrderUpdateDefault
                                        isServer={false}
                                        variant="ecommerce-module-order-update-default"
                                        order={order}
                                        data={props.data}
                                        language={props.language}
                                      />
                                      <OrderDeleteDefault
                                        isServer={false}
                                        variant="ecommerce-module-order-delete-default"
                                        order={order}
                                        data={props.data}
                                        language={props.language}
                                      />
                                      <OrderCheckoutDefault
                                        isServer={false}
                                        variant="ecommerce-module-order-checkout-default"
                                        product={props.product}
                                        order={order}
                                        data={props.data}
                                        language={props.language}
                                      />
                                    </div>
                                  );
                                });
                            }}
                          </EcommerceOrdersToProducts>
                        );
                      });
                    }}
                  </EcommerceOrdersToProducts>
                );
              }}
            </EcommerceOrder>
          );
        }}
      </EcommerceModuleOrderListDefault>
    </div>
  );
}
