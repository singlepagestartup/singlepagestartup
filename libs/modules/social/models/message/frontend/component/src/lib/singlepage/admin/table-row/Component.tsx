"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/social/models/message/sdk/client";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table-row/Component";

export function Component(props: IComponentPropsExtended) {
  const deleteEntity = api.delete();

  return (
    <ParentComponent
      {...props}
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
        <div className="flex flex-col col-span-3 gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Description</p>
          <p className="truncate">{props.data.description}</p>
        </div>
      </div>
    </ParentComponent>
  );
}
