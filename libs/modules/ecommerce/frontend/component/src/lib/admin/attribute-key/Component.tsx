"use client";

import { Component as ParentComponent } from "@sps/ecommerce/models/attribute-key/frontend/component";
import { Component as AttributesToAttributeKeys } from "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component";

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
            attributesToAttributeKeys={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <AttributesToAttributeKeys
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "attributeKeyId",
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
