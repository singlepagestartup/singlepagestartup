"use client";

import { Component as ParentComponent } from "@sps/rbac/models/permission/frontend/component";
import { Component as PermissionsToBillingModuleCurrencies } from "@sps/rbac/relations/permissions-to-billing-module-currencies/frontend/component";
import { Component as RolesToPermissions } from "@sps/rbac/relations/roles-to-permissions/frontend/component";
import { Component as BillingCurrency } from "@sps/billing/models/currency/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Permission } from "../";
import { Component as Role } from "../../role";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      rolesToPermissions={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <RolesToPermissions
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Role"
            rightModelAdminFormLabel="Permission"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Role
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.roleId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Permission
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.permissionId } as any}
                />
              );
            }}
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
      permissionsToBillingModuleCurrencies={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <PermissionsToBillingModuleCurrencies
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Permission"
            rightModelAdminFormLabel="Currency"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Permission
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.permissionId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <BillingCurrency
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.billingModuleCurrencyId } as any}
                />
              );
            }}
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
}
