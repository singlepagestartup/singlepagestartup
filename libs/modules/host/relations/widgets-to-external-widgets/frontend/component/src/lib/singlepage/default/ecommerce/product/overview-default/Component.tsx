import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import { Component as ProductAction } from "../action/Component";
import { Component as Page } from "@sps/host/models/page/frontend/component";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(props: ISpsComponentBase) {
  return (
    <Page
      isServer={props.isServer}
      hostUrl={props.hostUrl}
      variant="url-segment-value"
      segment="ecommerce.products.id"
    >
      {({ data }) => {
        if (!data) {
          return;
        }

        return (
          <Product
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
                    hostUrl={props.hostUrl}
                    variant="overview-default"
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
      }}
    </Page>
  );
}
