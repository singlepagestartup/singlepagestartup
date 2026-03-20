"use client";

import { Component as ParentComponent } from "@sps/ecommerce/models/store/frontend/component";
import { Component as StoresToAttributes } from "@sps/ecommerce/relations/stores-to-attributes/frontend/component";
import { Component as StoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { Component as StoresToOrders } from "@sps/ecommerce/relations/stores-to-orders/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Store } from "../";
import { Component as Attribute } from "../../attribute";
import { Component as Product } from "../../product";
import { Component as Order } from "../../order";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
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
                      column: "storeId",
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
      storesToProducts={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <StoresToProducts
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Store"
            rightModelAdminFormLabel="Product"
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
                      column: "storeId",
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
      storesToOrders={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <StoresToOrders
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Store"
            rightModelAdminFormLabel="Order"
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
                <Order
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.orderId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "storeId",
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
