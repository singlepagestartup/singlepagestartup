"use client";

import { Component as ParentComponent } from "@sps/billing/models/invoice/frontend/component";
import { Component as PaymentIntent } from "@sps/billing/models/payment-intent/frontend/component";
import { Component as PaymentIntentsToInvoices } from "@sps/billing/relations/payment-intents-to-invoices/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Invoice } from "../";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      paymentIntentsToInvoices={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <PaymentIntentsToInvoices
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Payment intent"
            rightModelAdminFormLabel="Invoice"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <PaymentIntent
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.paymentIntentId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Invoice
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.invoiceId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "invoiceId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
    />
  );
}
