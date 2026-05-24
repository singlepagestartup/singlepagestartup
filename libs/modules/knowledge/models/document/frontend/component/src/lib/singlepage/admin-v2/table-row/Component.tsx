"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/knowledge/models/document/sdk/client";
import { Component as AdminForm } from "../form";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table-row/Component";

export function Component(props: IComponentPropsExtended) {
  const deleteEntity = api.delete();

  return (
    <ParentComponent
      {...props}
      type="model"
      adminForm={() => {
        return (
          <AdminForm
            isServer={false}
            variant="admin-v2-form"
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
      <div className="grid grid-cols-1 gap-3 p-4 pt-6 lg:grid-cols-4">
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Title</p>
          <p className="truncate">{props.data.title}</p>
        </div>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Admin title</p>
          <p className="truncate">{props.data.adminTitle}</p>
        </div>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Slug</p>
          <p className="truncate">{props.data.slug}</p>
        </div>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="truncate">{props.data.status}</p>
        </div>
      </div>
    </ParentComponent>
  );
}
