"use client";

import { Component as ParentComponent } from "@sps/ecommerce/models/product/frontend/component";
import { Component as ProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  const isActive = props.url.startsWith(`${ADMIN_BASE_PATH}/ecommerce/product`);

  if (!isActive) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-bold tracking-tight capitalize">Product</h1>

      <ParentComponent
        isServer={props.isServer}
        variant="admin-v2-table"
        adminForm={(props) => {
          return (
            <ParentComponent
              isServer={props.isServer}
              data={props.data}
              variant="admin-v2-form"
              productsToAttributes={({ data, isServer }) => {
                if (!data) {
                  return;
                }

                return (
                  <ProductsToAttributes
                    isServer={isServer}
                    variant="admin-v2-table"
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
        }}
      />
    </div>
  );
}
