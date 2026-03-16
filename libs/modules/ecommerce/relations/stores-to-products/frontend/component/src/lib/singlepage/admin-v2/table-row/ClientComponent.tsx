"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/ecommerce/relations/stores-to-products/sdk/client";
import { Component as AdminForm } from "../form";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table-row/Component";
import { Component as StoresToProductsToAttributes } from "@sps/ecommerce/relations/stores-to-products-to-attributes/frontend/component";
import { Component as Attribute } from "@sps/ecommerce/models/attribute/frontend/component";

export function Component(props: IComponentPropsExtended) {
  const deleteEntity = api.delete();

  return (
    <ParentComponent
      {...props}
      module="ecommerce"
      name="stores-to-products"
      type="relation"
      adminForm={() => {
        return (
          <AdminForm
            isServer={props.isServer}
            variant="admin-v2-form"
            data={props.data}
            storesToProductsToAttributes={({ data, isServer }) => {
              if (!data?.id) {
                return null;
              }

              return (
                <StoresToProductsToAttributes
                  isServer={isServer}
                  variant="admin-v2-table"
                  relatedContext={{
                    model: "stores-to-products",
                    field: "storesToProductsId",
                  }}
                  relatedAdminForm={({ data, isServer }) => {
                    const attributeId = data?.attributeId;

                    if (!attributeId) {
                      return null;
                    }

                    return (
                      <Attribute
                        isServer={isServer}
                        variant="admin-v2-form"
                        data={{ id: attributeId } as any}
                      />
                    );
                  }}
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "storesToProductsId",
                            method: "eq",
                            value: data.id,
                          },
                        ],
                      },
                    },
                  }}
                />
              );
            }}
          />
        );
      }}
      relatedAdminForm={props.relatedAdminForm}
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
          <p className="text-xs text-muted-foreground">Variant</p>
          <p className="truncate">{props.data.variant}</p>
        </div>
      </div>
    </ParentComponent>
  );
}
