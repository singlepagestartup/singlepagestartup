"use client";

import { IComponentPropsExtended } from "./interface";
import { api, Provider } from "@sps/ecommerce/models/attribute/sdk/client";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table-row/Component";
import { internationalization } from "@sps/shared-configuration";

export function Component(props: IComponentPropsExtended) {
  const deleteEntity = api.delete();

  return (
    <Provider>
      <ParentComponent
        {...props}
        module="ecommerce"
        name="attribute"
        onDelete={() => {
          if (props.data?.id) {
            deleteEntity.mutate({ id: props.data.id });
          }
        }}
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs text-muted-foreground">Admin title</p>
            <p className="truncate">{props.data.adminTitle}</p>
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs text-muted-foreground">String</p>
            <p className="truncate">
              {props.data.string?.[internationalization.defaultLanguage.code]}
            </p>
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs text-muted-foreground">Number</p>
            <p className="truncate">{props.data.number}</p>
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs text-muted-foreground">Boolean</p>
            <p className="truncate">{props.data.boolean}</p>
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs text-muted-foreground">Datetime</p>
            <p className="truncate">{props.data.datetime?.toLocaleString()}</p>
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs text-muted-foreground">Variant</p>
            <p className="truncate">{props.data.variant}</p>
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
