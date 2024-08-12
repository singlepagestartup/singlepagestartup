"use client";

import { Component as ParentComponent } from "@sps/host/models/layout/frontend/component";
import { Component as LayoutsToWidgets } from "@sps/host/relations/layouts-to-widgets/frontend/component";
import { Component as PagesToLayouts } from "@sps/host/relations/pages-to-layouts/frontend/component";

export function Component() {
  return (
    <ParentComponent
      hostUrl="/"
      isServer={false}
      variant="admin-table"
      adminForm={(props) => {
        return (
          <ParentComponent
            isServer={false}
            hostUrl={props.hostUrl}
            data={props.data}
            variant="admin-form"
            layoutsToWidgets={({ data, hostUrl, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <LayoutsToWidgets
                  isServer={isServer}
                  hostUrl={hostUrl}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "layoutId",
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
            pagesToLayouts={({ data, hostUrl, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <PagesToLayouts
                  isServer={isServer}
                  hostUrl={hostUrl}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "layoutId",
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
