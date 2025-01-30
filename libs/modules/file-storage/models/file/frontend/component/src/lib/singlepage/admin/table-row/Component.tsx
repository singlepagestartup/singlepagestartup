"use client";

import { ErrorBoundary } from "@sps/ui-adapter";
import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/file-storage/models/file/sdk/client";
import Image from "next/image";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table-row/Component";

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
          <p className="text-xs text-muted-foreground">Variant</p>
          <p className="truncate">{props.data.variant}</p>
        </div>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <p className="text-xs text-muted-foreground">File</p>
          <p className="truncate">{props.data.file}</p>
          {props.data.file ? (
            <ErrorBoundary>
              <div className="w-full relative aspect-w-1 aspect-h-1">
                <Image
                  src={props.data.file}
                  alt=""
                  className="object-contain"
                  fill={true}
                />
              </div>
            </ErrorBoundary>
          ) : null}
        </div>
      </div>
    </ParentComponent>
  );
}
