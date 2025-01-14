import { IComponentPropsExtended } from "./interface";
import { Component as PaymentIntentsToInvoices } from "@sps/billing/relations/payment-intents-to-invoices/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="billing"
      data-model="payment-intent"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className="w-full flex flex-col"
    >
      <PaymentIntentsToInvoices
        isServer={props.isServer}
        hostUrl={props.hostUrl}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "paymentIntentId",
                  method: "eq",
                  value: props.data.id,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <PaymentIntentsToInvoices
                key={index}
                isServer={props.isServer}
                hostUrl={props.hostUrl}
                variant="default"
                data={entity}
              />
            );
          });
        }}
      </PaymentIntentsToInvoices>
    </div>
  );
}
