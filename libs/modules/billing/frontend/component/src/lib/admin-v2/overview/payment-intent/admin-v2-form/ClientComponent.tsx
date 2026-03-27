"use client";

import { Component as ParentComponent } from "@sps/billing/models/payment-intent/frontend/component";
import { Component as Currency } from "@sps/billing/models/currency/frontend/component";
import { Component as Invoice } from "@sps/billing/models/invoice/frontend/component";
import { Component as PaymentIntentsToCurrencies } from "@sps/billing/relations/payment-intents-to-currencies/frontend/component";
import { Component as PaymentIntentsToInvoices } from "@sps/billing/relations/payment-intents-to-invoices/frontend/component";
import { IComponentProps } from "./interface";
import { Component as PaymentIntent } from "../";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      paymentIntentsToCurrencies={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <PaymentIntentsToCurrencies
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Payment intent"
            rightModelAdminFormLabel="Currency"
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
                <Currency
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.currencyId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "paymentIntentId",
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
                      column: "paymentIntentId",
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
