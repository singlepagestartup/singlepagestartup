"use client";

import { Component as ParentComponent } from "@sps/ecommerce/models/attribute/frontend/component";
import { Component as AttributesToAttributeKeys } from "@sps/ecommerce/relations/attributes-to-attribute-keys/frontend/component";
import { Component as ProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";

export function Component() {
  return (
    <ParentComponent
      hostUrl="/"
      isServer={false}
      variant="admin-table"
      adminForm={(props) => {
        return (
          <ParentComponent
            isServer={false}
            hostUrl={props.hostUrl}
            data={props.data}
            variant="admin-form"
            attributesToAttributeKeys={({ data, hostUrl, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <AttributesToAttributeKeys
                  isServer={isServer}
                  hostUrl={hostUrl}
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
            productsToAttributes={({ data, hostUrl, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ProductsToAttributes
                  isServer={isServer}
                  hostUrl={hostUrl}
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
          />
        );
      }}
    />
  );
}
