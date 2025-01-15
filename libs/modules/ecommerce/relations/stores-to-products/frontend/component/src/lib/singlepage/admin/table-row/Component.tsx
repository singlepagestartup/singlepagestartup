"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/ecommerce/relations/stores-to-products/sdk/client";
import { Component as AdminForm } from "../form";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-table-row/Component";
import { Component as StoresToProductsToAttributes } from "@sps/ecommerce/relations/stores-to-products-to-attributes/frontend/component";

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
            isServer={false}
            hostUrl={props.hostUrl}
            variant="admin-form"
            data={props.data}
            storesToProductsToAttributes={({ data, hostUrl, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <StoresToProductsToAttributes
                  isServer={isServer}
                  hostUrl={hostUrl}
                  variant="admin-table"
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
      </div>
    </ParentComponent>
  );
}
