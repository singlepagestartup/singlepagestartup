import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@sps/shared-ui-shadcn";
import { Component as OrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/frontend/component";
import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import { Fragment } from "react/jsx-runtime";

export function Component(props: IComponentPropsExtended) {
  return (
    <OrdersToProducts
      isServer={props.isServer}
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
        options: {
          headers: {
            "Cache-Control": "no-store",
          },
        },
      }}
    >
      {({ data: ecommerceModuleOrdersToProducts }) => {
        return (
          <div className={cn("flex flex-col gap-1", props.className)}>
            {ecommerceModuleOrdersToProducts?.map(
              (ecommerceModuleOrdersToProduct, index) => {
                return (
                  <Fragment key={index}>
                    <OrdersToProducts
                      isServer={props.isServer}
                      variant="id-total-default"
                      data={ecommerceModuleOrdersToProduct}
                      language={props.language}
                    >
                      {({ data: totals }) => {
                        const availability = totals.find(
                          (total) =>
                            total.billingModuleCurrency.id ===
                            props.billingModuleCurrencyId,
                        );

                        return (
                          <Card
                            data-module="ecommerce"
                            data-model="order"
                            data-id={props.data.id || ""}
                            data-variant={props.variant}
                            data-available={availability ? true : false}
                            className={cn(
                              "w-full flex flex-col data-[available=false]:opacity-70",
                              props.className,
                            )}
                          >
                            <CardHeader>
                              <CardTitle className="text-xs">
                                Order #{props.data.id}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <OrdersToProducts
                                isServer={props.isServer}
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
                                {({
                                  data: ecommerceModuleOrdersToProducts,
                                }) => {
                                  return (
                                    <div className="flex flex-col gap-1">
                                      {ecommerceModuleOrdersToProducts?.map(
                                        (
                                          ecommerceModuleOrdersToProduct,
                                          index,
                                        ) => {
                                          return (
                                            <div
                                              key={index}
                                              className="flex flex-col gap-1"
                                            >
                                              <p className="text-sm text-muted-foreground">
                                                Quantity:{" "}
                                                {
                                                  ecommerceModuleOrdersToProduct.quantity
                                                }
                                              </p>

                                              <Product
                                                isServer={props.isServer}
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
                                                        <Product
                                                          key={index}
                                                          isServer={
                                                            props.isServer
                                                          }
                                                          variant="cart-default"
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
                                              </Product>
                                              <OrdersToProducts
                                                isServer={props.isServer}
                                                variant="id-total-default"
                                                data={
                                                  ecommerceModuleOrdersToProduct
                                                }
                                                language={props.language}
                                              >
                                                {({ data: totals }) => {
                                                  return totals.map(
                                                    (total, index) => {
                                                      return (
                                                        <p key={index}>
                                                          {total.total}{" "}
                                                          {
                                                            total
                                                              .billingModuleCurrency
                                                              .symbol
                                                          }
                                                        </p>
                                                      );
                                                    },
                                                  );
                                                }}
                                              </OrdersToProducts>
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>
                                  );
                                }}
                              </OrdersToProducts>
                              {props.children}
                            </CardContent>
                          </Card>
                        );
                      }}
                    </OrdersToProducts>
                  </Fragment>
                );
              },
            )}
          </div>
        );
      }}
    </OrdersToProducts>
  );
}
