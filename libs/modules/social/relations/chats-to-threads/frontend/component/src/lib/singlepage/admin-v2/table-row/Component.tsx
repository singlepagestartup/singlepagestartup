"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/social/relations/chats-to-threads/sdk/client";
import { Component as AdminForm } from "../form";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table-row/Component";

export function Component(props: IComponentPropsExtended) {
  const deleteEntity = api.delete();

  return (
    <ParentComponent
      {...props}
      module="social"
      name="chats-to-threads"
      type="relation"
      adminForm={() => {
        return (
          <AdminForm
            isServer={false}
            variant="admin-v2-form"
            data={props.data}
          />
        );
      }}
      leftModelAdminForm={props.leftModelAdminForm}
      rightModelAdminForm={props.rightModelAdminForm}
      leftModelAdminFormLabel={props.leftModelAdminFormLabel}
      rightModelAdminFormLabel={props.rightModelAdminFormLabel}
      onDelete={() => {
        if (props.data?.id) {
          deleteEntity.mutate({ id: props.data.id });
        }
      }}
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">ID</p>
          <p className="truncate font-mono text-xs">{props.data.id}</p>
        </div>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Variant</p>
          <p className="truncate">{props.data.variant}</p>
        </div>
      </div>
    </ParentComponent>
  );
}
