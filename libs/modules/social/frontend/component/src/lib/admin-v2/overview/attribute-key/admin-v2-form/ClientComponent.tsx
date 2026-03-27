"use client";

import { Component as ParentComponent } from "@sps/social/models/attribute-key/frontend/component";
import { Component as AttributeKeysToAttributes } from "@sps/social/relations/attribute-keys-to-attributes/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Attribute } from "../../attribute";
import { Component as AttributeKey } from "../";

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
            leftModelAdminFormLabel="Attribute key"
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
