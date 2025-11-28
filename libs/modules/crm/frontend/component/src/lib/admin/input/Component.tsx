"use client";

import { Component as ParentComponent } from "@sps/crm/models/input/frontend/component";

import { Component as InputsToOptions } from "@sps/crm/relations/inputs-to-options/frontend/component";

import { Component as StepsToInputs } from "@sps/crm/relations/steps-to-inputs/frontend/component";

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
            stepsToInputs={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <StepsToInputs
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
          />
        );
      }}
    />
  );
}
