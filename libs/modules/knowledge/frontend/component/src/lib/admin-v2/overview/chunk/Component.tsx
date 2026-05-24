"use client";

import { Component as ParentComponent } from "@sps/knowledge/models/chunk/frontend/component";
import { Component as Source } from "@sps/knowledge/models/source/frontend/component";
import { Component as SourcesToChunks } from "@sps/knowledge/relations/sources-to-chunks/frontend/component";

export function Component() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-bold tracking-tight capitalize">Chunks</h1>

      <ParentComponent
        isServer={false}
        variant="admin-v2-table"
        adminForm={(props) => {
          return (
            <ParentComponent
              isServer={false}
              data={props.data}
              variant="admin-v2-form"
              sourcesToChunks={({ data }) => {
                if (!data) {
                  return;
                }

                return (
                  <SourcesToChunks
                    isServer={false}
                    variant="admin-v2-table"
                    leftModelAdminFormLabel="Source"
                    rightModelAdminFormLabel="Chunk"
                    leftModelAdminForm={({ data }) => {
                      if (!data) {
                        return;
                      }

                      return (
                        <Source
                          isServer={false}
                          variant="admin-v2-form"
                          data={{ id: data.sourceId } as any}
                        />
                      );
                    }}
                    rightModelAdminForm={({ data }) => {
                      if (!data) {
                        return;
                      }

                      return (
                        <ParentComponent
                          isServer={false}
                          variant="admin-v2-form"
                          data={{ id: data.chunkId } as any}
                        />
                      );
                    }}
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
    </div>
  );
}
