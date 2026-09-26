"use client";

import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import { Component as EcommerceModuleOrder } from "@sps/ecommerce/models/order/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <RbacModuleSubject isServer={false} variant="authentication-me-default">
      {({ data: subject }) => {
        if (!subject) {
          return <></>;
        }

        return (
          <RbacModuleSubject
            isServer={false}
            variant="ecommerce-module-order-list-default"
            data={subject}
            language={props.language}
            apiProps={{
              params: {
                filters: {
                  and: [
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
            {({ data: ecommerceModuleOrders }) => {
              return ecommerceModuleOrders?.map((ecommerceModuleOrder) => {
                return (
                  <RbacModuleSubject
                    key={ecommerceModuleOrder.id}
                    isServer={false}
                    variant="ecommerce-module-order-list-orders-to-products-default"
                    data={subject}
                    language={props.language}
                    apiProps={{
                      params: {
                        filters: {
                          and: [
                            {
                              column: "orderId",
                              method: "eq",
                              value: ecommerceModuleOrder.id,
                            },
                          ],
                        },
                      },
                    }}
                  >
                    {({ data: ecommerceModuleOrdersToProducts }) => {
                      return (
                        <EcommerceModuleOrder
                          isServer={false}
                          variant="cart-default"
                          data={ecommerceModuleOrder}
                          ordersToProducts={ecommerceModuleOrdersToProducts}
                          language={props.language}
                        />
                      );
                    }}
                  </RbacModuleSubject>
                );
              });
            }}
          </RbacModuleSubject>
        );
      }}
    </RbacModuleSubject>
  );
}
