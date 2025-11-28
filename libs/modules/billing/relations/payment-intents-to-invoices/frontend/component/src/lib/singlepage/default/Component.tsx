import { IComponentPropsExtended } from "./interface";
import { Component as Invoice } from "@sps/billing/models/invoice/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="billing"
      data-relation="payment-intents-to-invoices"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className, props.className)}
    >
      <Invoice
        variant="find"
        isServer={props.isServer}
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.invoiceId,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <Invoice
                key={index}
                isServer={props.isServer}
                variant="default"
                data={entity}
              />
            );
          });
        }}
      </Invoice>
    </div>
  );
}
