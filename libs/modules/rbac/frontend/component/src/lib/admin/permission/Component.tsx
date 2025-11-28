"use client";

import { Component as ParentComponent } from "@sps/rbac/models/permission/frontend/component";
import { Component as RolesToPermissions } from "@sps/rbac/relations/roles-to-permissions/frontend/component";

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
            rolesToPermissions={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <RolesToPermissions
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "permissionId",
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
