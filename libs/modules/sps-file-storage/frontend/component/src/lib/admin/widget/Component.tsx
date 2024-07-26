"use client";

import { Component as ParentComponent } from "@sps/sps-file-storage/models/widget/frontend/component";
import { Component as WidgetsToFiles } from "@sps/sps-file-storage/relations/widgets-to-files/frontend/component";

export function Component() {
  return (
    <ParentComponent
      hostUrl="/"
      isServer={false}
      variant="admin-table"
      adminForm={(props) => {
        return (
          <ParentComponent
            {...props}
            variant="admin-form"
            widgetsToFiles={({ data, hostUrl, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <WidgetsToFiles
                  isServer={isServer}
                  hostUrl={hostUrl}
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
