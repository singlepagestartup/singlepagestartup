"use client";

import { Component as ParentComponent } from "@sps/host/models/widget/frontend/component";
import { Component as PagesToWidgets } from "@sps/host/relations/pages-to-widgets/frontend/component";
import { Component as LayoutsToWidgets } from "@sps/host/relations/layouts-to-widgets/frontend/component";
import { Component as WidgetsToExternalWidgets } from "@sps/host/relations/widgets-to-external-widgets/frontend/component";

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
            pagesToWidgets={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <PagesToWidgets
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "widgetId",
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
            layoutsToWidgets={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <LayoutsToWidgets
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "widgetId",
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
            widgetsToExternalModules={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <WidgetsToExternalWidgets
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "widgetId",
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
