import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";
import { Component as BillingModuleCurrency } from "@sps/billing/models/currency/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-relation="permissions-to-billing-module-currencies"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
    >
      <BillingModuleCurrency
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.billingModuleCurrencyId,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <BillingModuleCurrency
                key={index}
                isServer={props.isServer}
                variant="default"
                data={entity}
                language={props.language}
              />
            );
          });
        }}
      </BillingModuleCurrency>
    </div>
  );
}
