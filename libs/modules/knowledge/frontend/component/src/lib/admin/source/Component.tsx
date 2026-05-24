"use client";

import { Component as ParentComponent } from "@sps/knowledge/models/source/frontend/component";

import { Component as SourcesToFileStorageModuleFiles } from "@sps/knowledge/relations/sources-to-file-storage-module-files/frontend/component";

import { Component as SourcesToChunks } from "@sps/knowledge/relations/sources-to-chunks/frontend/component";

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
            sourcesToChunks={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <SourcesToChunks
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "sourceId",
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
            sourcesToFileStorageModuleFiles={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <SourcesToFileStorageModuleFiles
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "sourceId",
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
