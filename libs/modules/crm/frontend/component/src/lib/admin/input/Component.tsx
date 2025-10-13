"use client";

import { Component as ParentComponent } from "@sps/crm/models/input/frontend/component";
import { Component as FormsToInputs } from "@sps/crm/relations/forms-to-inputs/frontend/component";

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
                            column: "inputId",
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
            formsToInputs={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <FormsToInputs
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "inputId",
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
