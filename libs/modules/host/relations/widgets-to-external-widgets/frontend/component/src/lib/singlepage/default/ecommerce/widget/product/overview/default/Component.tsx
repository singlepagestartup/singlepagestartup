import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as EcommerceProduct } from "../../../../product/Component";
import { Component as HostModulePage } from "@sps/host/models/page/frontend/component";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";

export function Component(
  props: ISpsComponentBase & {
    url: string;
    language: string;
    data: IModel;
    variant: string;
  },
) {
  return (
    <HostModulePage
      isServer={props.isServer}
      variant="url-segment-value"
      segment="ecommerce.products.slug"
      url={props.url}
    >
      {({ data }) => {
        if (!data) {
          return;
        }

        return (
          <EcommerceModuleProduct
            isServer={props.isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "slug",
                      method: "eq",
                      value: data,
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
                    variant="overview-default"
                    data={product}
                    language={props.language}
                  />
                );
              });
            }}
          </EcommerceModuleProduct>
        );
      }}
    </HostModulePage>
  );
}
