"use client";

import { Component as ParentComponent } from "@sps/blog/models/article/frontend/component";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";
import { IComponentProps } from "./interface";
import { Component as AdminForm } from "../admin-v2-form";

export function Component(props: IComponentProps) {
  const isActive = props.url.startsWith(`${ADMIN_BASE_PATH}/blog/article`);

  if (!isActive) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-bold tracking-tight capitalize">Article</h1>

      <ParentComponent
        isServer={false}
        variant="admin-v2-table"
        adminForm={(adminProps) => {
          return (
            <AdminForm
              isServer={false}
              data={adminProps.data}
              variant="admin-v2-form"
            />
          );
        }}
      />
    </div>
  );
}
