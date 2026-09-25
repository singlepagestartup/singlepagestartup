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
                  <EcommerceModuleOrder
                    key={ecommerceModuleOrder.id}
                    isServer={false}
                    variant="cart-default"
                    data={ecommerceModuleOrder}
                    language={props.language}
                  />
                );
              });
            }}
          </RbacModuleSubject>
        );
      }}
    </RbacModuleSubject>
  );
}
