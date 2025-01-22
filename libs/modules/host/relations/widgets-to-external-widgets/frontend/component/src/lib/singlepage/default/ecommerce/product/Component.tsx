import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";
import { Component as ListDefault } from "./list-default/Component";
import { Component as BillingCurrency } from "@sps/billing/models/currency/frontend/component";
import { Component as OverviewDefault } from "./overview-default/Component";

export function Component(
  props: ISpsComponentBase & {
    data: IModel;
    url: string;
  },
) {
  return (
    <BillingCurrency
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
      {({ data }) => {
        if (props.data.variant === "product-list-default") {
          return (
            <ListDefault
              isServer={props.isServer}
              billingModuleCurrencyId={data?.[0]?.id}
            />
          );
        }

        if (props.data.variant === "product-overview-default") {
          return <OverviewDefault url={props.url} isServer={props.isServer} />;
        }

        return <></>;
      }}
    </BillingCurrency>
  );
}
