"use client";

import { IComponentPropsExtended } from "./interface";
import { api, Provider } from "@sps/knowledge/models/chunk/sdk/client";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table-row/Component";

export function Component(props: IComponentPropsExtended) {
  const deleteEntity = api.delete();

  return (
    <Provider>
      <ParentComponent
        {...props}
        module="knowledge"
        name="chunk"
        onDelete={() => {
          if (props.data?.id) {
            deleteEntity.mutate({ id: props.data.id });
          }
        }}
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs text-muted-foreground">Text</p>
            <p className="truncate">{props.data.text}</p>
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs text-muted-foreground">Chunk Index</p>
            <p className="truncate">{props.data.chunkIndex}</p>
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs text-muted-foreground">Tokens</p>
            <p className="truncate">{props.data.tokenEstimate}</p>
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs text-muted-foreground">Content Hash</p>
            <p className="truncate font-mono text-xs">
              {props.data.contentHash}
            </p>
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs text-muted-foreground">ID</p>
            <p className="truncate font-mono text-xs">{props.data.id}</p>
          </div>
        </div>
      </ParentComponent>
    </Provider>
  );
}
