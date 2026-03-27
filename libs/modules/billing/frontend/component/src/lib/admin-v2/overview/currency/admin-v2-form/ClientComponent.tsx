"use client";

import { Component as ParentComponent } from "@sps/billing/models/currency/frontend/component";
import { Component as PaymentIntent } from "@sps/billing/models/payment-intent/frontend/component";
import { Component as PaymentIntentsToCurrencies } from "@sps/billing/relations/payment-intents-to-currencies/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Currency } from "../";

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
                      column: "currencyId",
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
