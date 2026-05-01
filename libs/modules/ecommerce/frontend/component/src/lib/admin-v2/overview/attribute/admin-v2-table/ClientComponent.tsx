"use client";

import { Component as ParentComponent } from "@sps/ecommerce/models/attribute/frontend/component";
import { isAdminRoute } from "@sps/shared-frontend-client-utils";
import { IComponentProps } from "./interface";
import { Component as AdminForm } from "../admin-v2-form";

export function Component(props: IComponentProps) {
  const isActive = isAdminRoute(props.url, "ecommerce", "attribute");

  if (!isActive) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-bold tracking-tight capitalize">
        Attribute
      </h1>

      <ParentComponent
        isServer={false}
        variant="admin-v2-table"
        adminForm={(props) => {
          return (
            <AdminForm
              isServer={false}
              data={props.data}
              variant="admin-v2-form"
            />
          );
        }}
      />
    </div>
  );
}
