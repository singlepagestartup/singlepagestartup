"use client";

import { Component as ParentComponent } from "@sps/crm/models/step/frontend/component";

import { Component as StepsToInputs } from "@sps/crm/relations/steps-to-inputs/frontend/component";

import { Component as FormsToSteps } from "@sps/crm/relations/forms-to-steps/frontend/component";

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
            formsToSteps={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <FormsToSteps
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "stepId",
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
                            column: "stepId",
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
