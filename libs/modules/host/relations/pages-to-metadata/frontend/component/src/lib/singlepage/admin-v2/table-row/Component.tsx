"use client";

import { memo, useCallback } from "react";
import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/host/relations/pages-to-metadata/sdk/client";
import { Component as AdminForm } from "../form";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table-row/Component";

export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const { mutate: deleteEntity } = api.delete();
  const onDelete = useCallback(() => {
    if (props.data?.id) deleteEntity({ id: props.data.id });
  }, [deleteEntity, props.data?.id]);

  return (
    <ParentComponent
      {...props}
      module="host"
      name="pages-to-metadata"
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
      onDelete={onDelete}
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Metadata</p>
          <p className="break-all text-sm">{props.data.metadataId}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Page</p>
          <p className="break-all text-sm">{props.data.pageId}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Order index</p>
          <p>{props.data.orderIndex}</p>
        </div>
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
});
