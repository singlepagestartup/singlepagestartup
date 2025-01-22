"use client";

import { Component as ParentComponent } from "@sps/file-storage/models/widget/frontend/component";
import { Component as WidgetsToFiles } from "@sps/file-storage/relations/widgets-to-files/frontend/component";

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
            widgetsToFiles={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <WidgetsToFiles
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
