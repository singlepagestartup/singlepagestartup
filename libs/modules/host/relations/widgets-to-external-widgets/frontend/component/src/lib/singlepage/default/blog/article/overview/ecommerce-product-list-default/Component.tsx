import { Component as Article } from "@sps/blog/models/article/frontend/component";
import { Component as Page } from "@sps/host/models/page/frontend/component";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as StoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { Component as Store } from "@sps/ecommerce/models/store/frontend/component";
import { Component as ArticlesToEcommerceModuleProducts } from "@sps/blog/relations/articles-to-ecommerce-module-products/frontend/component";
import { Component as EcommerceProductAction } from "../../../../ecommerce/product/action/Component";

export function Component(
  props: ISpsComponentBase & {
    url: string;
    language: string;
  },
) {
  return (
    <Page
      isServer={props.isServer}
      variant="url-segment-value"
      segment="blog.articles.id"
      url={props.url}
    >
      {({ data }) => {
        if (!data) {
          return;
        }

        return (
          <Article
            isServer={props.isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "eq",
                      value: data,
                    },
                  ],
                },
              },
            }}
          >
            {({ data }) => {
              return data?.map((entity, index) => {
                return (
                  <ArticlesToEcommerceModuleProducts
                    key={index}
                    isServer={props.isServer}
                    variant="find"
                    apiProps={{
                      params: {
                        filters: {
                          and: [
                            {
                              column: "articleId",
                              method: "eq",
                              value: entity.id,
                            },
                          ],
                        },
                      },
                    }}
                  >
                    {({ data: articlesToEcommerceModuleProducts }) => {
                      return (
                        <div className="grid lg:grid-cols-2 gap-4">
                          {articlesToEcommerceModuleProducts?.map(
                            (articleToEcommerceModuleProduct, index) => {
                              return (
                                <EcommerceModuleProduct
                                  key={index}
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
                                              articleToEcommerceModuleProduct.ecommerceModuleProductId,
                                          },
                                        ],
                                      },
                                    },
                                  }}
                                >
                                  {({ data: products }) => {
                                    return products?.map((product, index) => {
                                      return (
                                        <EcommerceModuleProduct
                                          key={index}
                                          isServer={props.isServer}
                                          variant="card-default"
                                          data={product}
                                          language={props.language}
                                        >
                                          <StoresToProducts
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
                                            {({ data: storesToProducts }) => {
                                              return storesToProducts?.map(
                                                (storeToProduct, index) => {
                                                  return (
                                                    <Store
                                                      key={index}
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
                                                                  storeToProduct.storeId,
                                                              },
                                                            ],
                                                          },
                                                        },
                                                      }}
                                                    >
                                                      {({ data: stores }) => {
                                                        return stores?.map(
                                                          (store, index) => {
                                                            return (
                                                              <EcommerceProductAction
                                                                key={index}
                                                                store={store}
                                                                isServer={
                                                                  props.isServer
                                                                }
                                                                product={
                                                                  product
                                                                }
                                                                language={
                                                                  props.language
                                                                }
                                                              />
                                                            );
                                                          },
                                                        );
                                                      }}
                                                    </Store>
                                                  );
                                                },
                                              );
                                            }}
                                          </StoresToProducts>
                                        </EcommerceModuleProduct>
                                      );
                                    });
                                  }}
                                </EcommerceModuleProduct>
                              );
                            },
                          )}
                        </div>
                      );
                    }}
                  </ArticlesToEcommerceModuleProducts>
                );
              });
            }}
          </Article>
        );
      }}
    </Page>
  );
}
