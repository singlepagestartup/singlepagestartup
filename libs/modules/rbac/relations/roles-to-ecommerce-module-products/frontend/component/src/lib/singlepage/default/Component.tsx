import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-relation="roles-to-ecommerce-module-products"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
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
                  value: props.data.ecommerceModuleProductId,
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
          return data?.map((entity, index) => {
            return (
              <EcommerceModuleProduct
                key={index}
                isServer={props.isServer}
                variant="default"
                data={entity}
              />
            );
          });
        }}
      </EcommerceModuleProduct>
    </div>
  );
}
