"use client";

import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import { IComponentProps } from "./interface";
import { Component as EcommerceModuleSubjectsToEcommerceModuleOrders } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/frontend/component";
import { Component as EcommerceModuleOrder } from "@sps/ecommerce/models/order/frontend/component";
import { Component as EcommerceModuleOrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/frontend/component";

export function Component(props: IComponentProps) {
  return (
    <RbacModuleSubject isServer={false} variant="authentication-me-default">
      {({ data: subject }) => {
        if (!subject) {
          return <></>;
        }

        return (
          <div className="w-fit flex flex-row items-center gap-2 p-5 bg-red-300">
            <RbacModuleSubject
              isServer={false}
              variant="ecommerce-module-order-quantity-default"
              data={subject}
              language={props.language}
              className="w-fit"
            ></RbacModuleSubject>
            <RbacModuleSubject
              isServer={false}
              variant="ecommerce-module-order-total-default"
              data={subject}
              language={props.language}
              className="w-fit"
            ></RbacModuleSubject>

            {/* <EcommerceModuleSubjectsToEcommerceModuleOrders
              isServer={false}
              variant="find"
              apiProps={{
                params: {
                  filters: {
                    and: [
                      {
                        column: "subjectId",
                        method: "eq",
                        value: subject.id,
                      },
                    ],
                  },
                },
              }}
            >
              {({ data: subjectsToEcommerceModuleOrders }) => {
                return (
                  <EcommerceModuleOrder
                    isServer={false}
                    variant="find"
                    apiProps={{
                      params: {
                        filters: {
                          and: [
                            {
                              column: "id",
                              method: "inArray",
                              value: subjectsToEcommerceModuleOrders?.map(
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
                    {({ data: ecommerceModuleOrders }) => {
                      return ecommerceModuleOrders?.map(
                        (ecommerceModuleOrder, index) => {
                          return (
                            <EcommerceModuleOrdersToProducts
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
                                        value: ecommerceModuleOrder.id,
                                      },
                                    ],
                                  },
                                },
                              }}
                            >
                              {({ data: ecommerceModuleOrdersToProducts }) => {
                                return ecommerceModuleOrdersToProducts?.map(
                                  (ecommerceModuleOrdersToProduct, index) => {
                                    return (
                                      <EcommerceModuleOrdersToProducts
                                        key={index}
                                        isServer={false}
                                        variant="id-total-default"
                                        data={ecommerceModuleOrdersToProduct}
                                        language={props.language}
                                      />
                                    );
                                  },
                                );
                              }}
                            </EcommerceModuleOrdersToProducts>
                          );
                        },
                      );
                    }}
                  </EcommerceModuleOrder>
                );
              }}
            </EcommerceModuleSubjectsToEcommerceModuleOrders> */}
          </div>
        );
      }}
    </RbacModuleSubject>
  );
}
