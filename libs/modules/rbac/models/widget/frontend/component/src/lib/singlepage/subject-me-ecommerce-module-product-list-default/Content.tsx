import { memo } from "react";
import { Component as CollectionSkeleton } from "./Skeleton";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as WidgetsToEcommerceModuleWidgets } from "@sps/rbac/relations/widgets-to-ecommerce-module-widgets/frontend/component";
import { Component as EcommerceModuleWidgetsToProducts } from "@sps/ecommerce/relations/widgets-to-products/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { IContentProps, IProductRowProps } from "./interface";

const ProductRow = memo(function ProductRow(props: IProductRowProps) {
  return (
    <Subject
      isServer={false}
      variant="me-ecommerce-module-product-card-default"
      ecommerceModuleProduct={props.ecommerceModuleProduct}
      language={props.language}
    />
  );
});

export function Component(props: IContentProps) {
  const unavailable = (
    <p role="alert" className="p-6 text-sm text-muted-foreground">
      {props.language === "ru"
        ? "Каталог временно недоступен."
        : "The catalog is currently unavailable."}
    </p>
  );
  const empty = (
    <p
      role="status"
      className="col-span-full rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground"
    >
      {props.language === "ru" ? "Товаров пока нет." : "No products yet."}
    </p>
  );
  if (!props.widgetId) return unavailable;
  return (
    <WidgetsToEcommerceModuleWidgets
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              { column: "widgetId", method: "eq", value: props.widgetId },
              { column: "variant", method: "eq", value: "default" },
            ],
          },
        },
      }}
    >
      {({ data: owners }) =>
        owners === undefined ? (
          <CollectionSkeleton />
        ) : owners.length !== 1 || !owners[0]?.ecommerceModuleWidgetId ? (
          unavailable
        ) : (
          <EcommerceModuleWidgetsToProducts
            isServer={props.isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "widgetId",
                      method: "eq",
                      value: owners[0].ecommerceModuleWidgetId,
                    },
                    { column: "variant", method: "eq", value: "default" },
                  ],
                },
                orderBy: {
                  and: [
                    { column: "orderIndex", method: "asc" },
                    { column: "id", method: "asc" },
                  ],
                },
              },
            }}
          >
            {({ data: links }) =>
              links === undefined ? (
                <CollectionSkeleton />
              ) : links.length === 0 ? (
                empty
              ) : links.some((link) => !link.productId) ? (
                unavailable
              ) : (
                <EcommerceModuleProduct
                  isServer={props.isServer}
                  variant="find"
                  skeleton={<CollectionSkeleton />}
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "id",
                            method: "inArray",
                            value: links.map((link) => link.productId),
                          },
                        ],
                      },
                    },
                  }}
                >
                  {({ data: products }) =>
                    products === undefined ? (
                      <CollectionSkeleton />
                    ) : (
                      <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {links.map((link) => {
                          const product = products.find(
                            (candidate) => candidate.id === link.productId,
                          );
                          return product ? (
                            <ProductRow
                              key={link.id}
                              ecommerceModuleProduct={product}
                              language={props.language}
                            />
                          ) : (
                            <div key={link.id}>{unavailable}</div>
                          );
                        })}
                      </div>
                    )
                  }
                </EcommerceModuleProduct>
              )
            }
          </EcommerceModuleWidgetsToProducts>
        )
      }
    </WidgetsToEcommerceModuleWidgets>
  );
}
