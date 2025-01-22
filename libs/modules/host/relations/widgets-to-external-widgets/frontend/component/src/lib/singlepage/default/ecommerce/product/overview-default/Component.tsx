import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import { Component as ProductAction } from "../action/Component";
import { Component as Page } from "@sps/host/models/page/frontend/component";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(
  props: ISpsComponentBase & {
    url: string;
  },
) {
  return (
    <Page
      isServer={props.isServer}
      variant="url-segment-value"
      segment="ecommerce.products.id"
      url={props.url}
    >
      {({ data }) => {
        if (!data) {
          return;
        }

        return (
          <Product
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
              if (!data) {
                return;
              }

              return data.map((entity, index) => {
                return (
                  <Product
                    key={index}
                    isServer={props.isServer}
                    variant="overview-default"
                    data={entity}
                  >
                    <ProductAction isServer={props.isServer} product={entity} />
                  </Product>
                );
              });
            }}
          </Product>
        );
      }}
    </Page>
  );
}
