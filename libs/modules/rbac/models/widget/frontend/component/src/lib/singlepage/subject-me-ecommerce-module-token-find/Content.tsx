import { memo } from "react";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as EcommerceModuleWidgetsToProducts } from "@sps/ecommerce/relations/widgets-to-products/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { Component as WidgetsToEcommerceModuleWidgets } from "@sps/rbac/relations/widgets-to-ecommerce-module-widgets/frontend/component";
import { Component as ClientComponent } from "./ClientComponent";
import { Component as CollectionSkeleton } from "./Skeleton";
import type { IContentProps, IProductCardProps } from "./interface";

const ProductCard = memo(function ProductCard(props: IProductCardProps) {
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
        ? "Каталог токенов временно недоступен."
        : "The token catalogue is currently unavailable."}
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
              ) : links.length !== 6 ||
                links.some((link) => !link.productId) ||
                new Set(links.map((link) => link.productId)).size !== 6 ? (
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
                  {({ data: products }) => {
                    if (products === undefined) return <CollectionSkeleton />;
                    const ordered = links.flatMap((link) => {
                      const product = products.find(
                        (candidate) => candidate.id === link.productId,
                      );
                      return product ? [product] : [];
                    });
                    const subscriptions = ordered.filter(
                      (product) => product.type === "subscription",
                    );
                    const topups = ordered.filter(
                      (product) => product.type === "one_off",
                    );
                    if (
                      ordered.length !== 6 ||
                      subscriptions.length !== 1 ||
                      topups.length !== 5
                    )
                      return unavailable;
                    const pro = subscriptions[0];
                    return (
                      <ClientComponent
                        language={props.language}
                        proCard={
                          <ProductCard
                            ecommerceModuleProduct={pro}
                            language={props.language}
                          />
                        }
                        topups={topups.map((product) => ({
                          id: product.id,
                          title:
                            product.title?.[props.language] || product.slug,
                          card: (
                            <ProductCard
                              key={product.id}
                              ecommerceModuleProduct={product}
                              language={props.language}
                            />
                          ),
                        }))}
                      />
                    );
                  }}
                </EcommerceModuleProduct>
              )
            }
          </EcommerceModuleWidgetsToProducts>
        )
      }
    </WidgetsToEcommerceModuleWidgets>
  );
}
