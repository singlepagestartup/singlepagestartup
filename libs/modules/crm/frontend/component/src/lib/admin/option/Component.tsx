"use client";

import { Component as ParentComponent } from "@sps/crm/models/option/frontend/component";

import { Component as InputsToOptions } from "@sps/crm/relations/inputs-to-options/frontend/component";

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
            inputsToOptions={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <InputsToOptions
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "optionId",
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
