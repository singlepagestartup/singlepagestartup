"use client";

import { memo, useCallback } from "react";
import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/social/relations/widgets-to-website-builder-module-widgets/sdk/client";
import { Component as AdminForm } from "../form";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table-row/Component";

export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const { mutate: deleteRecord } = api.delete();
  const onDelete = useCallback(() => {
    if (props.data?.id) deleteRecord({ id: props.data.id });
  }, [deleteRecord, props.data?.id]);

  return (
    <ParentComponent
      {...props}
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
      onDelete={onDelete}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-4 pt-6">
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Order index</p>
          <p className="truncate">{props.data.orderIndex}</p>
        </div>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Variant</p>
          <p className="truncate">{props.data.variant}</p>
        </div>
      </div>
    </ParentComponent>
  );
});
