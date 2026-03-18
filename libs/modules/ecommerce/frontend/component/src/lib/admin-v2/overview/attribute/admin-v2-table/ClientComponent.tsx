"use client";

import { Component as ParentComponent } from "@sps/ecommerce/models/attribute/frontend/component";
import { Component as AttributeKeysToAttributes } from "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component";
import { Component as ProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  const isActive = props.url.startsWith(
    `${ADMIN_BASE_PATH}/ecommerce/attribute`,
  );

  if (!isActive) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-bold tracking-tight capitalize">
        Attribute
      </h1>

      <ParentComponent
        isServer={false}
        variant="admin-v2-table"
        adminForm={(formProps) => {
          return (
            <ParentComponent
              isServer={false}
              data={formProps.data}
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
        }}
      />
    </div>
  );
}
