"use client";

import { Component as ParentComponent } from "@sps/ecommerce/models/product/frontend/component";
import { Component as ProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Product } from "../";
import { Component as Attribute } from "../../attribute";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
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
                      column: "productId",
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
