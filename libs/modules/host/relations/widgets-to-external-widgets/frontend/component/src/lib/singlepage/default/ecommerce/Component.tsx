import { IComponentPropsExtended } from "../interface";
import { Component as EcommerceWidget } from "@sps/ecommerce/models/widget/frontend/component";
import { Component as ProductsList } from "./products-list/Component";
import { Component as StoresList } from "./stores-list/Component";
import { Component as ProductOverview } from "./product-overview/Component";
import { Component as CategoryOverview } from "./category-overview/Component";
import { Component as BillingCurrency } from "@sps/billing/models/currency/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <EcommerceWidget
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
                value: props.data.externalWidgetId,
              },
            ],
          },
        },
      }}
    >
      {({ data }) => {
        return data?.map((entity, index) => {
          return (
            <EcommerceWidget
              key={index}
              isServer={props.isServer}
              hostUrl={props.hostUrl}
              variant={entity.variant as any}
              data={entity}
            >
              {entity.variant.includes("products-list") ? (
                <BillingCurrency
                  isServer={props.isServer}
                  hostUrl={props.hostUrl}
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
                    return (
                      <ProductsList
                        isServer={props.isServer}
                        hostUrl={props.hostUrl}
                        billingModuleCurrencyId={data?.[0]?.id}
                      />
                    );
                  }}
                </BillingCurrency>
              ) : null}
              {/* {entity.variant.includes("stores-list") ? (
                <StoresList isServer={props.isServer} hostUrl={props.hostUrl} />
              ) : null}
              {entity.variant.includes("product-overview") ? (
                <ProductOverview
                  isServer={props.isServer}
                  hostUrl={props.hostUrl}
                />
              ) : null}
              {entity.variant.includes("category-overview") ? (
                <CategoryOverview
                  isServer={props.isServer}
                  hostUrl={props.hostUrl}
                />
              ) : null} */}
            </EcommerceWidget>
          );
        });
      }}
    </EcommerceWidget>
  );
}
