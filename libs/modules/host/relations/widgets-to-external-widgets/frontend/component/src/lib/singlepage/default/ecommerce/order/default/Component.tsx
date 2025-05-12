import { Component as RbacSubject } from "../../../rbac/subject/Component";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { IComponentProps } from "./interface";
import { Component as EcommerceModuleOrder } from "@sps/ecommerce/models/order/frontend/component";
import { Component as EcommerceModuleOrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/frontend/component";

export function Component(props: IComponentProps) {
  return (
    <EcommerceModuleOrder
      isServer={props.isServer}
      variant="default"
      data={props.data}
      language={props.language}
    >
      <EcommerceModuleOrdersToProducts
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
        {({ data: ecommerceModuleOrdersToProducts }) => {
          return (
            <div className="flex flex-col gap-1">
              {ecommerceModuleOrdersToProducts?.map(
                (ecommerceModuleOrdersToProduct, index) => {
                  return (
                    <div key={index} className="flex flex-col gap-1">
                      <p className="text-sm text-muted-foreground">
                        Quantity: {ecommerceModuleOrdersToProduct.quantity}
                      </p>

                      <EcommerceModuleProduct
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
                            (ecommerceModuleProduct, index) => {
                              return (
                                <EcommerceModuleProduct
                                  key={index}
                                  isServer={props.isServer}
                                  variant="cart-default"
                                  data={ecommerceModuleProduct}
                                  language={props.language}
                                />
                              );
                            },
                          );
                        }}
                      </EcommerceModuleProduct>
                    </div>
                  );
                },
              )}
            </div>
          );
        }}
      </EcommerceModuleOrdersToProducts>
    </EcommerceModuleOrder>
  );
}
