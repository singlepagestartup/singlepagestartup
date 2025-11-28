import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as Product } from "../../../../../product";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
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
