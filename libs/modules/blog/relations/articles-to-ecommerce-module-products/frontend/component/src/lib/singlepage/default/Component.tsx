import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="blog"
      data-relation="articles-to-ecommerce-module-products"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
    >
      <EcommerceModuleProduct
        variant="find"
        isServer={props.isServer}
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.ecommerceModuleProductId,
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
                variant={entity.variant as any}
                data={entity}
                language={props.language}
              />
            );
          });
        }}
      </EcommerceModuleProduct>
    </div>
  );
}
