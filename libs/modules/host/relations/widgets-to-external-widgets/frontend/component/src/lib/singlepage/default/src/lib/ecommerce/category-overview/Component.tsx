import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import { Component as ProductAction } from "../product-action/Component";
import { Component as Page } from "@sps/host/models/page/frontend/component";
import { Component as CategoriesToProducts } from "@sps/ecommerce/relations/categories-to-products/frontend/component";
import { Component as Category } from "@sps/ecommerce/models/category/frontend/component";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(props: ISpsComponentBase) {
  return (
    <Page
      isServer={props.isServer}
      hostUrl={props.hostUrl}
      variant="url-segment-value"
      segment="ecommerce.categories.id"
    >
      {({ data }) => {
        if (!data) {
          return;
        }

        return (
          <Category
            isServer={props.isServer}
            hostUrl={props.hostUrl}
            variant="overview-default"
            data={{
              id: data,
            }}
          >
            <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
              <CategoriesToProducts
                isServer={props.isServer}
                hostUrl={props.hostUrl}
                variant="find"
                apiProps={{
                  params: {
                    filters: {
                      and: [
                        {
                          column: "categoryId",
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
                      <Product
                        key={index}
                        isServer={props.isServer}
                        hostUrl={props.hostUrl}
                        variant="find"
                        apiProps={{
                          params: {
                            filters: {
                              and: [
                                {
                                  column: "id",
                                  method: "eq",
                                  value: entity.productId,
                                },
                              ],
                            },
                          },
                        }}
                      >
                        {({ data }) => {
                          if (!data) {
                            return;
                          }

                          return data.map((entity, index) => {
                            return (
                              <Product
                                key={index}
                                isServer={props.isServer}
                                hostUrl={props.hostUrl}
                                variant="default"
                                data={entity}
                              >
                                <ProductAction
                                  isServer={props.isServer}
                                  hostUrl={props.hostUrl}
                                  product={entity}
                                />
                              </Product>
                            );
                          });
                        }}
                      </Product>
                    );
                  });
                }}
              </CategoriesToProducts>
            </div>
          </Category>
        );
      }}
    </Page>
  );
}
