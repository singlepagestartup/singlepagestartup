"use client";

import { Component as ParentComponent } from "@sps/host/models/metadata/frontend/component";
import { Component as PagesToMetadata } from "@sps/host/relations/pages-to-metadata/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Metadata } from "../";
import { Component as Page } from "../../page";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      pagesToMetadata={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <PagesToMetadata
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Page"
            rightModelAdminFormLabel="Metadata"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Page
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.pageId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Metadata
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.metadataId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "metadataId",
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
