"use client";

import { Component as ParentComponent } from "@sps/rbac/models/action/frontend/component";
import { Component as RolesToActions } from "@sps/rbac/relations/roles-to-actions/frontend/component";

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
            rolesToActions={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <RolesToActions
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "actionId",
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
