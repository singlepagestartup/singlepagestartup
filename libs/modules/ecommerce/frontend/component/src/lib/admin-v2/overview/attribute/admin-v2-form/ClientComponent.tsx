"use client";

import { Component as ParentComponent } from "@sps/ecommerce/models/attribute/frontend/component";
import { Component as AttributeKeysToAttributes } from "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component";
import { Component as ProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Product } from "../../product";
import { Component as Attribute } from "../";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      attributeKeysToAttributes={({ data, isServer }) => {
        if (!data) {
          return;
        }

        return (
          <AttributeKeysToAttributes
            isServer={isServer}
            variant="admin-table"
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
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Product
                  isServer={false}
                  variant="admin-v2-form"
                  data={
                    {
                      id: data.productId,
                    } as any
                  }
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
                  data={
                    {
                      id: data.attributeId,
                    } as any
                  }
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
