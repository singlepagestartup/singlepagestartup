import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@sps/shared-ui-shadcn";
import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div className={cn("flex flex-col gap-1", props.className)}>
      {props.ordersToProducts.map((ecommerceModuleOrdersToProduct) => {
        const availability = ecommerceModuleOrdersToProduct.total.find(
          (total) =>
            total.billingModuleCurrency.id === props.billingModuleCurrencyId,
        );

        return (
          <Card
            key={ecommerceModuleOrdersToProduct.id}
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
              <CardTitle className="text-xs">Order #{props.data.id}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                {props.ordersToProducts.map(
                  (ecommerceModuleOrdersToProduct) => {
                    return (
                      <div
                        key={ecommerceModuleOrdersToProduct.id}
                        className="flex flex-col gap-1"
                      >
                        <p className="text-sm text-muted-foreground">
                          Quantity: {ecommerceModuleOrdersToProduct.quantity}
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
                          {({ data: ecommerceModuleProducts }) => {
                            return ecommerceModuleProducts?.map(
                              (ecommerceModuleProduct) => {
                                return (
                                  <Product
                                    key={ecommerceModuleProduct.id}
                                    isServer={props.isServer}
                                    variant="cart-default"
                                    data={ecommerceModuleProduct}
                                    language={props.language}
                                  />
                                );
                              },
                            );
                          }}
                        </Product>
                        {ecommerceModuleOrdersToProduct.total
                          .filter((total) => {
                            return props.billingModuleCurrencyId
                              ? total.billingModuleCurrency.id ===
                                  props.billingModuleCurrencyId
                              : true;
                          })
                          .map((total, index) => {
                            return (
                              <p key={index}>
                                {total.total}{" "}
                                {total.billingModuleCurrency.symbol}
                              </p>
                            );
                          })}
                      </div>
                    );
                  },
                )}
              </div>
              {props.children}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
