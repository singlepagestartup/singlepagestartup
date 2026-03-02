"use client";

import { IComponentPropsExtended } from "./interface";
import {
  api,
  Provider,
} from "@sps/ecommerce/relations/products-to-attributes/sdk/client";
import { Component as AdminForm } from "../form";
import { Component as Attribute } from "@sps/ecommerce/models/attribute/frontend/component";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table-row/Component";

export function Component(props: IComponentPropsExtended) {
  const deleteEntity = api.delete();

  return (
    <Provider>
      <ParentComponent
        {...props}
        module="ecommerce"
        name="products-to-attributes"
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
        relatedAdminForm={() => {
          if (!props.data?.attributeId) {
            return null;
          }

          return (
            <Attribute
              isServer={false}
              variant="admin-v2-form"
              data={{ id: props.data.attributeId } as any}
            />
          );
        }}
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
            <p className="text-xs text-muted-foreground">Product ID</p>
            <p className="truncate font-mono text-xs">{props.data.productId}</p>
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs text-muted-foreground">Attribute ID</p>
            <p className="truncate font-mono text-xs">
              {props.data.attributeId}
            </p>
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs text-muted-foreground">Order Index</p>
            <p className="truncate">{props.data.orderIndex}</p>
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs text-muted-foreground">Variant</p>
            <p className="truncate">{props.data.variant}</p>
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs text-muted-foreground">Class Name</p>
            <p className="truncate">{props.data.className || "—"}</p>
          </div>
        </div>
      </ParentComponent>
    </Provider>
  );
}
