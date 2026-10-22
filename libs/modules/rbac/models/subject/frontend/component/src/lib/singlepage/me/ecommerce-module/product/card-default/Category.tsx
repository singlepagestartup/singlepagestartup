import { Component as EcommerceModuleCategory } from "@sps/ecommerce/models/category/frontend/component";
import { Component as EcommerceModuleCategoriesToProducts } from "@sps/ecommerce/relations/categories-to-products/frontend/component";
import type { IProductDetailProps as IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
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
                value: props.ecommerceModuleProduct.id,
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
          <div className="flex flex-wrap gap-2">
            {categoriesToProducts?.map((categoryToProduct, index) => {
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
                    return categories?.map((category, index) => {
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
