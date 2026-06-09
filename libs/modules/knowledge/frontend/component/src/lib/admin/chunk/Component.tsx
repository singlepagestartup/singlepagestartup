"use client";

import { Component as ParentComponent } from "@sps/knowledge/models/chunk/frontend/component";

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
                            column: "chunkId",
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
