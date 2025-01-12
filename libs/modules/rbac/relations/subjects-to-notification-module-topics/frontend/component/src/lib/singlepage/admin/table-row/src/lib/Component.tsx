"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/rbac/relations/subjects-to-notification-module-topics/sdk/client";
import { Component as AdminForm } from "../../../form";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-table-row/Component";

export function Component(props: IComponentPropsExtended) {
  const deleteEntity = api.delete();

  return (
    <ParentComponent
      {...props}
      module="rbac"
      name="subjects-to-notification-module-topics"
      type="relation"
      adminForm={() => {
        return (
          <AdminForm
            isServer={false}
            hostUrl={props.hostUrl}
            variant="admin-form"
            data={props.data}
          />
        );
      }}
      onDelete={() => {
        if (props.data?.id) {
          deleteEntity.mutate({ id: props.data.id });
        }
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-4 pt-6">
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Variant</p>
          <p className="truncate">{props.data.variant}</p>
        </div>
      </div>
    </ParentComponent>
  );
}
