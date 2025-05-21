"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/host/models/page/sdk/client";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table-row/Component";

export function Component(props: IComponentPropsExtended) {
  const deleteEntity = api.delete();

  return (
    <ParentComponent
      {...props}
      module="host"
      name="page"
      onDelete={() => {
        if (props.data?.id) {
          deleteEntity.mutate({ id: props.data.id });
        }
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-4 pt-6">
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Title</p>
          <p className="truncate">{props.data.title}</p>
        </div>
        <div className="flex flex-col col-span-3 gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Url</p>
          <p className="truncate">{props.data.url}</p>
        </div>
      </div>
    </ParentComponent>
  );
}
