"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/file-storage/models/file/sdk/client";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table-row/Component";
import { Component as Default } from "../../default";
import { internationalization } from "@sps/shared-configuration";

export function Component(props: IComponentPropsExtended) {
  const deleteEntity = api.delete();

  return (
    <ParentComponent
      {...props}
      module="file-storage"
      name="file"
      onDelete={() => {
        if (props.data?.id) {
          deleteEntity.mutate({ id: props.data.id });
        }
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-4 pt-6">
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Admin title</p>
          <p className="truncate">{props.data.adminTitle}</p>
        </div>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">Variant</p>
          <p className="truncate">{props.data.variant}</p>
        </div>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">File</p>
          <p className="truncate">{props.data.file}</p>
          {props.data.file ? (
            <Default
              isServer={false}
              data={props.data}
              variant="default"
              language={internationalization.defaultLanguage.code}
            />
          ) : null}
        </div>
      </div>
    </ParentComponent>
  );
}
