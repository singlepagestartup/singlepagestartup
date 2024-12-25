import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import { Component as ProductAction } from "../product-action/Component";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(
  props: ISpsComponentBase & {
    billingModuleCurrencyId?: string;
  },
) {
  return (
    <Product isServer={props.isServer} hostUrl={props.hostUrl} variant="find">
      {({ data }) => {
        return data?.map((entity, index) => {
          return (
            <Product
              key={index}
              isServer={props.isServer}
              hostUrl={props.hostUrl}
              variant="card-default"
              data={entity}
            >
              <ProductAction
                isServer={props.isServer}
                hostUrl={props.hostUrl}
                product={entity}
                billingModuleCurrencyId={props.billingModuleCurrencyId}
              />
            </Product>
          );
        });
      }}
    </Product>
  );
}
