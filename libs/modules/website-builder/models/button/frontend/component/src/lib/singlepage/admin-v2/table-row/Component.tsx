"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/website-builder/models/button/sdk/client";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table-row/Component";
import { internationalization } from "@sps/shared-configuration";

export function Component(props: IComponentPropsExtended) {
  const deleteEntity = api.delete();

  return (
    <ParentComponent
      {...props}
      module="website-builder"
      name="button"
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
          <p className="text-xs text-muted-foreground">Admin Title</p>
          <p className="truncate">{props.data.adminTitle}</p>
        </div>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Title</p>
          <p className="truncate">
            {props.data.title?.[internationalization.defaultLanguage.code]}
          </p>
        </div>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Variant</p>
          <p className="truncate">{props.data.variant}</p>
        </div>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Slug</p>
          <p className="truncate">{props.data.slug}</p>
        </div>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Url</p>
          <p className="truncate">{props.data.url}</p>
        </div>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Class Name</p>
          <p className="truncate">{props.data.className || ""}</p>
        </div>
      </div>
    </ParentComponent>
  );
}
