import { Component as CollectionSkeleton } from "./Skeleton";
import { notFound } from "next/navigation";
import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import { Component as Store } from "@sps/ecommerce/models/store/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { Component as CategoriesToProducts } from "@sps/ecommerce/relations/categories-to-products/frontend/component";
import { Component as StoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { Component as Category } from "@sps/ecommerce/models/category/frontend/component";
import type { IContentProps } from "./interface";
export function Component(props: IContentProps) {
  if (!props.ecommerceModuleCategorySlug) return null;
  return (
    <Category
      isServer={props.isServer}
      variant="find"
      skeleton={<CollectionSkeleton />}
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "slug",
                method: "eq",
                value: props.ecommerceModuleCategorySlug,
              },
            ],
          },
        },
      }}
    >
      {({ data: categories }) => {
        if (categories?.length === 0) notFound();
        return categories?.map((category) => (
          <Category
            key={category.id}
            isServer={props.isServer}
            variant="overview-default"
            dataSource="props"
            data={category}
            language={props.language}
            embedded
          >
            <section className="min-w-0 space-y-5">
              <h2 className="text-2xl font-semibold tracking-tight">
                {props.language === "ru"
                  ? "Товары в категории"
                  : "Products in this category"}
              </h2>
              <CategoriesToProducts
                isServer={props.isServer}
                variant="find"
                skeleton={<CollectionSkeleton />}
                apiProps={{
                  params: {
                    filters: {
                      and: [
                        {
                          column: "categoryId",
                          method: "eq",
                          value: category.id,
                        },
                      ],
                    },
                  },
                }}
              >
                {({ data: links }) =>
                  links?.length ? (
                    <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {links.map((link) => (
                        <Product
                          key={link.id}
                          isServer={props.isServer}
                          variant="find"
                          apiProps={{
                            params: {
                              filters: {
                                and: [
                                  {
                                    column: "id",
                                    method: "eq",
                                    value: link.productId,
                                  },
                                ],
                              },
                            },
                          }}
                        >
                          {({ data: products }) =>
                            products?.map((product) => (
                              <StoresToProducts
                                key={product.id}
                                isServer={props.isServer}
                                variant="find"
                                apiProps={{
                                  params: {
                                    filters: {
                                      and: [
                                        {
                                          column: "productId",
                                          method: "eq",
                                          value: product.id,
                                        },
                                      ],
                                    },
                                  },
                                }}
                              >
                                {({ data: storeLinks }) =>
                                  storeLinks?.length ? (
                                    storeLinks.map((storeLink) => (
                                      <Store
                                        key={storeLink.id}
                                        isServer={props.isServer}
                                        variant="find"
                                        apiProps={{
                                          params: {
                                            filters: {
                                              and: [
                                                {
                                                  column: "id",
                                                  method: "eq",
                                                  value: storeLink.storeId,
                                                },
                                              ],
                                            },
                                          },
                                        }}
                                      >
                                        {({ data: stores }) =>
                                          stores?.map((store) => (
                                            <Subject
                                              key={store.id}
                                              isServer={false}
                                              variant="me-ecommerce-module-product-card-default"
                                              ecommerceModuleProduct={product}
                                              ecommerceModuleStore={store}
                                              language={props.language}
                                            />
                                          ))
                                        }
                                      </Store>
                                    ))
                                  ) : (
                                    <Subject
                                      isServer={false}
                                      variant="me-ecommerce-module-product-card-default"
                                      ecommerceModuleProduct={product}
                                      language={props.language}
                                    />
                                  )
                                }
                              </StoresToProducts>
                            ))
                          }
                        </Product>
                      ))}
                    </div>
                  ) : (
                    <p
                      role="status"
                      className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground"
                    >
                      {props.language === "ru"
                        ? "Товаров пока нет."
                        : "No products in this category yet."}
                    </p>
                  )
                }
              </CategoriesToProducts>
            </section>
          </Category>
        ));
      }}
    </Category>
  );
}
