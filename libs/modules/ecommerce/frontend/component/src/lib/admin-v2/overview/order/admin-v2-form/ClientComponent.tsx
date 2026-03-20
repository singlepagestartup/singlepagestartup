"use client";

import { Component as ParentComponent } from "@sps/ecommerce/models/order/frontend/component";
import { Component as OrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/frontend/component";
import { Component as OrdersToBillingModuleCurrencies } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/frontend/component";
import { Component as OrdersToBillingModulePaymentIntents } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/frontend/component";
import { Component as OrdersToFileStorageModuleFiles } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/frontend/component";
import { Component as BillingCurrency } from "@sps/billing/models/currency/frontend/component";
import { Component as PaymentIntent } from "@sps/billing/models/payment-intent/frontend/component";
import { Component as FileStorageFile } from "@sps/file-storage/models/file/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Order } from "../";
import { Component as Product } from "../../product";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      ordersToProducts={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <OrdersToProducts
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Order"
            rightModelAdminFormLabel="Product"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Order
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.orderId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Product
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.productId } as any}
                />
              );
            }}
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
      ordersToBillingModuleCurrencies={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <OrdersToBillingModuleCurrencies
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Order"
            rightModelAdminFormLabel="Currency"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Order
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.orderId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <BillingCurrency
                  isServer={false}
                  variant="admin-form"
                  data={{ id: data.billingModuleCurrencyId } as any}
                />
              );
            }}
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
      ordersToBillingModulePaymentIntents={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <OrdersToBillingModulePaymentIntents
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Order"
            rightModelAdminFormLabel="Payment Intent"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Order
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.orderId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <PaymentIntent
                  isServer={false}
                  variant="admin-form"
                  data={{ id: data.billingModulePaymentIntentId } as any}
                />
              );
            }}
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
      ordersToFileStorageModuleFiles={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <OrdersToFileStorageModuleFiles
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Order"
            rightModelAdminFormLabel="File"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Order
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.orderId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <FileStorageFile
                  isServer={false}
                  variant="admin-form"
                  data={{ id: data.fileStorageModuleFileId } as any}
                />
              );
            }}
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
}
