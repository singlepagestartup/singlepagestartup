"use client";

import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import { IComponentProps } from "./interface";
import { ShoppingCart } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@sps/shared-ui-shadcn";
import { Component as EcommerceModuleSubjectsToEcommerceModuleOrders } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/frontend/component";
import { Component as EcommerceModuleOrder } from "@sps/ecommerce/models/order/frontend/component";
import { Component as EcommerceModuleOrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/frontend/component";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as EcommerceProduct } from "../../../../../../ecommerce/product/Component";

export function Component(props: IComponentProps) {
  return (
    <RbacModuleSubject isServer={false} variant="authentication-me-default">
      {({ data: subject }) => {
        if (!subject) {
          return <></>;
        }

        return (
          <Sheet>
            <SheetTrigger>
              <div className="w-10 h-10 flex flex-row items-center justify-center rounded-full border border-primary relative">
                <ShoppingCart className="w-4 h-4 text-primary" />

                <RbacModuleSubject
                  isServer={false}
                  variant="ecommerce-module-order-quantity-default"
                  data={subject}
                  language={props.language}
                  className=""
                >
                  {({ data: ecommerceModuleOrderQuantity }) => {
                    if (ecommerceModuleOrderQuantity) {
                      return (
                        <div className="absolute -top-1 -left-1 w-fit min-w-5 h-5 px-1 rounded-xl bg-primary flex items-center justify-center text-[10px] font-medium text-white">
                          <p className="text-white">
                            {ecommerceModuleOrderQuantity}
                          </p>
                        </div>
                      );
                    }

                    return <></>;
                  }}
                </RbacModuleSubject>
              </div>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Cart</SheetTitle>
                <SheetDescription>
                  <EcommerceModuleSubjectsToEcommerceModuleOrders
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
                                    {({
                                      data: ecommerceModuleOrdersToProducts,
                                    }) => {
                                      return ecommerceModuleOrdersToProducts?.map(
                                        (
                                          ecommerceModuleOrdersToProduct,
                                          index,
                                        ) => {
                                          return (
                                            <EcommerceModuleProduct
                                              key={index}
                                              isServer={false}
                                              variant="find"
                                              apiProps={{
                                                params: {
                                                  filters: {
                                                    and: [
                                                      {
                                                        column: "id",
                                                        method: "eq",
                                                        value:
                                                          ecommerceModuleOrdersToProduct.productId,
                                                      },
                                                    ],
                                                  },
                                                },
                                              }}
                                            >
                                              {({
                                                data: ecommerceModuleProducts,
                                              }) => {
                                                return ecommerceModuleProducts?.map(
                                                  (
                                                    ecommerceModuleProduct,
                                                    index,
                                                  ) => {
                                                    return (
                                                      <EcommerceProduct
                                                        key={index}
                                                        isServer={false}
                                                        variant="default"
                                                        data={
                                                          ecommerceModuleProduct
                                                        }
                                                        language={
                                                          props.language
                                                        }
                                                      />
                                                    );
                                                  },
                                                );
                                              }}
                                            </EcommerceModuleProduct>
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
                  </EcommerceModuleSubjectsToEcommerceModuleOrders>
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        );
      }}
    </RbacModuleSubject>
  );
}
