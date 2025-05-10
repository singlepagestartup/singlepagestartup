import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as BillingModuleCurrency } from "@sps/billing/models/currency/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="ecommerce"
      data-model="order"
      data-variant={props.variant}
      className={cn("w-full flex flex-row gap-3", props.className)}
    >
      {props.data.map((entity, index) => {
        return (
          <div key={index} className="flex flex-row gap-1">
            <p>{entity.total}</p>
            <BillingModuleCurrency
              isServer={props.isServer}
              variant="default"
              data={entity.billingModuleCurrency}
              language={props.language}
            ></BillingModuleCurrency>
          </div>
        );
      })}
    </div>
  );
}
