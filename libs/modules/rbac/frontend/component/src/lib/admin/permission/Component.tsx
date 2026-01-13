"use client";

import { Component as ParentComponent } from "@sps/rbac/models/permission/frontend/component";
import { Component as RolesToPermissions } from "@sps/rbac/relations/roles-to-permissions/frontend/component";
import { Component as PermissionsToBillingModuleCurrencies } from "@sps/rbac/relations/permissions-to-billing-module-currencies/frontend/component";

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
            permissionsToBillingModuleCurrencies={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <PermissionsToBillingModuleCurrencies
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
