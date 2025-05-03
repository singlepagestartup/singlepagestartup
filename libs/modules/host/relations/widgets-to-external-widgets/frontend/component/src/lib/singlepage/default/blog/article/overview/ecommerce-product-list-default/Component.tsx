import { Component as Article } from "@sps/blog/models/article/frontend/component";
import { Component as Page } from "@sps/host/models/page/frontend/component";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as ArticlesToEcommerceModuleProducts } from "@sps/blog/relations/articles-to-ecommerce-module-products/frontend/component";
import { Component as EcommerceProduct } from "../../../../ecommerce/product/Component";

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
                                        <EcommerceProduct
                                          key={index}
                                          isServer={props.isServer}
                                          variant="card-default"
                                          data={product}
                                          language={props.language}
                                        />
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
