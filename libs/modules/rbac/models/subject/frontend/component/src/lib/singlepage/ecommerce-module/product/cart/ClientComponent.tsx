"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SubjectsToEcommerceModuleOrders } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/frontend/component";
import { Component as EcommerceOrder } from "@sps/ecommerce/models/order/frontend/component";
import { Component as EcommerceOrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/frontend/component";
import { Component as OrdersUpdate } from "./actions/OrdersUpdate";
import { Component as OrdersDelete } from "./actions/OrdersDelete";
import { Component as OrdersCheckout } from "./actions/OrdersCheckout";
import { Component as OrderCreateDefault } from "../../order/create-default/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <SubjectsToEcommerceModuleOrders
        isServer={false}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "subjectId",
                  method: "eq",
                  value: props.data.id,
                },
              ],
            },
          },
        }}
      >
        {({ data: subjectsToEcommerceOrders }) => {
          if (!subjectsToEcommerceOrders) {
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
                        value: subjectsToEcommerceOrders?.map(
                          (entity) => entity.ecommerceModuleOrderId,
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
                                  return subjectsToEcommerceOrders.find(
                                    (subjectToEcommerceModuleOrder) => {
                                      return (
                                        subjectToEcommerceModuleOrder.ecommerceModuleOrderId ===
                                        ordersWithCurrentProduct.orderId
                                      );
                                    },
                                  );
                                })
                                .map((orderToProduct, index) => {
                                  const subjectToEcommerceModuleOrder =
                                    subjectsToEcommerceOrders.find(
                                      (subjectToEcommerceModuleOrder) => {
                                        return (
                                          subjectToEcommerceModuleOrder.ecommerceModuleOrderId ===
                                          orderToProduct.orderId
                                        );
                                      },
                                    );

                                  if (!subjectToEcommerceModuleOrder) {
                                    return;
                                  }

                                  return (
                                    <div
                                      key={index}
                                      className="flex flex-col gap-2"
                                    >
                                      <OrdersUpdate
                                        isServer={false}
                                        variant={props.variant}
                                        product={props.product}
                                        order={order}
                                        data={props.data}
                                        language={props.language}
                                      />
                                      <OrdersDelete
                                        isServer={false}
                                        variant={props.variant}
                                        product={props.product}
                                        order={order}
                                        data={props.data}
                                        language={props.language}
                                      />
                                      <OrdersCheckout
                                        isServer={false}
                                        variant={props.variant}
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
      </SubjectsToEcommerceModuleOrders>
    </div>
  );
}
