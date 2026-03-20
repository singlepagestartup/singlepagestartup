"use client";

import { Component as ParentComponent } from "@sps/ecommerce/models/attribute-key/frontend/component";
import { Component as AttributeKeysToAttributes } from "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component";
import { IComponentProps } from "./interface";
import { Component as AttributeKey } from "../";
import { Component as Attribute } from "../../attribute";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      attributeKeysToAttributes={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <AttributeKeysToAttributes
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Attribute Key"
            rightModelAdminFormLabel="Attribute"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <AttributeKey
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.attributeKeyId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Attribute
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.attributeId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "attributeKeyId",
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
}
