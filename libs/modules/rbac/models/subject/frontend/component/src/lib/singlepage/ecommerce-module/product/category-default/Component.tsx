import { Component as EcommerceModuleCategory } from "@sps/ecommerce/models/category/frontend/component";
import { Component as EcommerceModuleCategoriesToProducts } from "@sps/ecommerce/relations/categories-to-products/frontend/component";
import { twMerge } from "tailwind-merge";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  if (!props.ecommerceModuleProductId) return null;
  return (
    <EcommerceModuleCategoriesToProducts
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "productId",
                method: "eq",
                value: props.ecommerceModuleProductId,
              },
            ],
          },
        },
      }}
    >
      {({ data: categoriesToProducts }) => {
        if (!categoriesToProducts?.length) {
          return null;
        }
        return (
          <div
            data-module="rbac"
            data-model="subject"
            data-variant={props.variant}
            className={twMerge("flex flex-wrap gap-2", props.className)}
          >
            {categoriesToProducts?.map((categoryToProduct) => {
              return (
                <EcommerceModuleCategory
                  key={categoryToProduct.id}
                  isServer={props.isServer}
                  variant="find"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "id",
                            method: "eq",
                            value: categoryToProduct.categoryId,
                          },
                        ],
                      },
                    },
                  }}
                >
                  {({ data: categories }) => {
                    return categories?.map((category) => {
                      return (
                        <EcommerceModuleCategory
                          key={category.id}
                          isServer={props.isServer}
                          variant="button-default"
                          dataSource="props"
                          data={category}
                          language={props.language}
                        />
                      );
                    });
                  }}
                </EcommerceModuleCategory>
              );
            })}
          </div>
        );
      }}
    </EcommerceModuleCategoriesToProducts>
  );
}
