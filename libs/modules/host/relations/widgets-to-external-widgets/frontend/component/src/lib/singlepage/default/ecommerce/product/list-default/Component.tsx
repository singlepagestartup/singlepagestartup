import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import { Component as ProductAction } from "../action/Component";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(
  props: ISpsComponentBase & {
    billingModuleCurrencyId?: string;
    language: string;
  },
) {
  return (
    <Product isServer={props.isServer} variant="find">
      {({ data }) => {
        return (
          <div className="grid lg:grid-cols-2 gap-4">
            {data?.map((entity, index) => {
              return (
                <Product
                  key={index}
                  isServer={props.isServer}
                  variant="card-default"
                  data={entity}
                  language={props.language}
                >
                  <ProductAction
                    isServer={props.isServer}
                    product={entity}
                    billingModuleCurrencyId={props.billingModuleCurrencyId}
                    language={props.language}
                  />
                </Product>
              );
            })}
          </div>
        );
      }}
    </Product>
  );
}
