"use client";

import { Component as Page } from "@sps/host/models/page/frontend/component";
import { Component as ParentComponent } from "@sps/host/models/metadata/frontend/component";
import { Component as PagesToMetadata } from "@sps/host/relations/pages-to-metadata/frontend/component";

import { Component as MetadataToFileStorageModuleFiles } from "@sps/host/relations/metadata-to-file-storage-module-files/frontend/component";

export function Component() {
  return (
    <ParentComponent
      isServer={false}
      variant="admin-table"
      adminForm={(props) => {
        return (
          <ParentComponent
            isServer={false}
            data={props.data}
            variant="admin-form"
            preview={({ control, metadataId }) => (
              <Page
                isServer={false}
                variant="seo-preview"
                control={control}
                metadataId={metadataId}
              />
            )}
            metadataToFileStorageModuleFiles={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <MetadataToFileStorageModuleFiles
                  isServer={isServer}
                  variant="admin-table"
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
            pagesToMetadata={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <PagesToMetadata
                  isServer={isServer}
                  variant="admin-table"
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
      }}
    />
  );
}
