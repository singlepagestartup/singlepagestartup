"use client";

import { Component as ParentComponent } from "@sps/ecommerce/models/order/frontend/component";
import { Component as OrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/frontend/component";
import { Component as OrdersToBillingModulePaymentIntents } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/frontend/component";
import { Component as OrdersToBillingModuleCurrencies } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/frontend/component";
import { Component as OrdersToFileStorageModuleFiles } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/frontend/component";
import { Component as OrdersToSocialModuleChats } from "@sps/ecommerce/relations/orders-to-social-module-chats/frontend/component";

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
            ordersToProducts={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <OrdersToProducts
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "orderId",
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
            ordersToBillingModulePaymentIntents={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <OrdersToBillingModulePaymentIntents
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "orderId",
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
            ordersToBillingModuleCurrencies={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <OrdersToBillingModuleCurrencies
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "orderId",
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
            ordersToFileStorageModuleFiles={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <OrdersToFileStorageModuleFiles
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "orderId",
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
            ordersToSocialModuleChats={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <OrdersToSocialModuleChats
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "orderId",
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
