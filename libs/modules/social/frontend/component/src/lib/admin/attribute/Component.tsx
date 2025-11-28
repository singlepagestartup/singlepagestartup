"use client";

import { Component as ParentComponent } from "@sps/social/models/attribute/frontend/component";
import { Component as AttributeKeysToAttributes } from "@sps/social/relations/attribute-keys-to-attributes/frontend/component";
import { Component as ProfilesToAttributes } from "@sps/social/relations/profiles-to-attributes/frontend/component";

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
            profilesToAttributes={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ProfilesToAttributes
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
          />
        );
      }}
    />
  );
}
