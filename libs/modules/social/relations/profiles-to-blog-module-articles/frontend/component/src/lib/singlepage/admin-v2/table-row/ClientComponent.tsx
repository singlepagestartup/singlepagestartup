"use client";

import { memo, useCallback, useState } from "react";
import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/social/relations/profiles-to-blog-module-articles/sdk/client";
import { Component as AdminForm } from "../form";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table-row/Component";

export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const { mutate, error } = api.delete();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const renderForm = useCallback<
    NonNullable<IComponentPropsExtended["adminForm"]>
  >(
    ({ data }) => (
      <AdminForm isServer={false} variant="admin-v2-form" data={data} />
    ),
    [],
  );
  const onDelete = useCallback(() => {
    if (deletingId) {
      return;
    }
    setDeletingId(props.data.id);
    mutate({ id: props.data.id }, { onSettled: () => setDeletingId(null) });
  }, [deletingId, props.data.id, mutate]);

  return (
    <div aria-busy={deletingId === props.data.id}>
      <ParentComponent
        {...props}
        isServer={false}
        type="relation"
        adminForm={props.adminForm ?? renderForm}
        onDelete={onDelete}
      >
        <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-3">
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs text-muted-foreground">Profile</p>
            <p className="truncate">{props.data.profileId}</p>
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs text-muted-foreground">Article</p>
            <p className="truncate">{props.data.blogModuleArticleId}</p>
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs text-muted-foreground">Order index</p>
            <p className="truncate">{props.data.orderIndex}</p>
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs text-muted-foreground">Variant</p>
            <p className="truncate">{props.data.variant}</p>
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs text-muted-foreground">Class name</p>
            <p className="truncate">{props.data.className}</p>
          </div>
        </div>
      </ParentComponent>
      {deletingId ? <p role="status">Deleting relation...</p> : null}
      {error ? <p role="alert">Could not delete relation.</p> : null}
    </div>
  );
});
