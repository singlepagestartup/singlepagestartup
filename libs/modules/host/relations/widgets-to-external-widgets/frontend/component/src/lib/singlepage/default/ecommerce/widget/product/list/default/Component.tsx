import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";
import { Component as Product } from "../../../../product/Component";

export function Component(
  props: ISpsComponentBase & {
    url: string;
    language: string;
    variant: string;
    data: IModel;
  },
) {
  return (
    <EcommerceModuleProduct isServer={props.isServer} variant="find">
      {({ data: products }) => {
        return (
          <div className="grid lg:grid-cols-2 gap-4">
            {products?.map((product, index) => {
              return (
                <Product
                  key={index}
                  isServer={props.isServer}
                  variant={product.variant as any}
                  data={product}
                  language={props.language}
                />
              );
            })}
          </div>
        );
      }}
    </EcommerceModuleProduct>
  );
}
