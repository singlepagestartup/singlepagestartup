"use client";

import { Component as ParentComponent } from "@sps/rbac/models/role/frontend/component";
import { Component as RolesToEcommerceModuleProducts } from "@sps/rbac/relations/roles-to-ecommerce-module-products/frontend/component";
import { Component as RolesToPermissions } from "@sps/rbac/relations/roles-to-permissions/frontend/component";
import { Component as SubjectsToRoles } from "@sps/rbac/relations/subjects-to-roles/frontend/component";
import { Component as EcommerceProduct } from "@sps/ecommerce/models/product/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Permission } from "../../permission";
import { Component as Role } from "../";
import { Component as Subject } from "../../subject";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      rolesToActions={({ data }) => {
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
                      column: "roleId",
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
      subjectsToRoles={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <SubjectsToRoles
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Subject"
            rightModelAdminFormLabel="Role"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Subject
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.subjectId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
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
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "roleId",
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
      rolesToEcommerceModuleProducts={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <RolesToEcommerceModuleProducts
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Role"
            rightModelAdminFormLabel="Product"
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
                <EcommerceProduct
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.ecommerceModuleProductId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "roleId",
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
