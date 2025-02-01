"use client";

import { Component as ParentComponent } from "@sps/crm/models/form/frontend/component";
import { Component as WidgetsToForms } from "@sps/crm/relations/widgets-to-forms/frontend/component";

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
            widgetsToForms={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <WidgetsToForms
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "formId",
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
