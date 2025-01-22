"use client";

import { Component as ParentComponent } from "@sps/billing/models/invoice/frontend/component";
import { Component as PaymentIntentsToInvoices } from "@sps/billing/relations/payment-intents-to-invoices/frontend/component";

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
      }}
    />
  );
}
