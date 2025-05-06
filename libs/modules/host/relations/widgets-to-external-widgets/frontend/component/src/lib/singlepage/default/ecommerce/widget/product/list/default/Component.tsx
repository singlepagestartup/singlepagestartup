import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as BillingModuleCurrency } from "@sps/billing/models/currency/frontend/component";
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
    <BillingModuleCurrency
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "isDefault",
                method: "eq",
                value: true,
              },
            ],
          },
        },
      }}
    >
      {({ data: currencies }) => {
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
                        billingModuleCurrencyId={
                          currencies?.[0]?.id || undefined
                        }
                      />
                    );
                  })}
                </div>
              );
            }}
          </EcommerceModuleProduct>
        );
      }}
    </BillingModuleCurrency>
  );
}
