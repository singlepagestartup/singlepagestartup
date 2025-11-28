"use client";

import { Component as ParentComponent } from "@sps/billing/models/payment-intent/frontend/component";
import { Component as PaymentIntentsToInvoices } from "@sps/billing/relations/payment-intents-to-invoices/frontend/component";
import { Component as PaymentIntentsToCurrencies } from "@sps/billing/relations/payment-intents-to-currencies/frontend/component";

export function Component() {
  return (
    <ParentComponent
      isServer={false}
      variant="admin-table"
      adminForm={(props) => {
        return (
          <ParentComponent
            isServer={false}
            data={props.data}
            variant="admin-form"
            paymentIntentsToCurrencies={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <PaymentIntentsToCurrencies
                  isServer={isServer}
                  variant="admin-table"
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
            paymentIntentsToInvoices={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <PaymentIntentsToInvoices
                  isServer={isServer}
                  variant="admin-table"
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
      }}
    />
  );
}
