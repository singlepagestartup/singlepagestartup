"use client";

import { Component as ParentComponent } from "@sps/ecommerce/models/attribute/frontend/component";
import { Component as AttributeKeysToAttributes } from "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component";
import { Component as ProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";
import { Component as StoresToAttributes } from "@sps/ecommerce/relations/stores-to-attributes/frontend/component";
import { Component as AttributesToBillingModuleCurrencies } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/frontend/component";
import { Component as BillingCurrency } from "@sps/billing/models/currency/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Product } from "../../product";
import { Component as Attribute } from "../";
import { Component as AttributeKey } from "../../attribute-key";
import { Component as Store } from "../../store";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      attributeKeysToAttributes={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <AttributeKeysToAttributes
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Attribute Key"
            rightModelAdminFormLabel="Attribute"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <AttributeKey
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.attributeKeyId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Attribute
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.attributeId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "attributeId",
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
      productsToAttributes={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ProductsToAttributes
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Product"
            rightModelAdminFormLabel="Attribute"
            leftModelAdminForm={({ data }) => {
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
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Attribute
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.attributeId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "attributeId",
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
      storesToAttributes={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <StoresToAttributes
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Store"
            rightModelAdminFormLabel="Attribute"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Store
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.storeId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Attribute
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.attributeId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "attributeId",
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
      attributesToBillingModuleCurrencies={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <AttributesToBillingModuleCurrencies
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Attribute"
            rightModelAdminFormLabel="Currency"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Attribute
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.attributeId } as any}
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
                      column: "attributeId",
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
