"use client";

import { Component as ParentComponent } from "@sps/host/models/metadata/frontend/component";
import { Component as PagesToMetadata } from "@sps/host/relations/pages-to-metadata/frontend/component";
import { Component as File } from "@sps/file-storage/models/file/frontend/component";
import { Component as MetadataToFiles } from "@sps/host/relations/metadata-to-file-storage-module-files/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Metadata } from "../";
import { Component as Page } from "../../page";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      metadataToFileStorageModuleFiles={({ data }) =>
        data ? (
          <MetadataToFiles
            isServer={false}
            variant="admin-v2-table"
            rightModelAdminFormLabel="Cover file"
            rightModelAdminForm={({ data }) => (
              <File
                isServer={false}
                variant="admin-v2-form"
                data={
                  data?.fileStorageModuleFileId
                    ? ({ id: data.fileStorageModuleFileId } as any)
                    : undefined
                }
              />
            )}
            apiProps={{
              params: {
                filters: {
                  and: [{ column: "metadataId", method: "eq", value: data.id }],
                },
              },
            }}
          />
        ) : null
      }
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
