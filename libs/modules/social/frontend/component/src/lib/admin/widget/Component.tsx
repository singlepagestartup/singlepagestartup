"use client";

import { Component as WidgetsToWebsiteBuilderModuleWidgets } from "@sps/social/relations/widgets-to-website-builder-module-widgets/frontend/component";

import { Component as ParentComponent } from "@sps/social/models/widget/frontend/component";

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
            widgetsToWebsiteBuilderModuleWidgets={({ data }) =>
              data ? (
                <WidgetsToWebsiteBuilderModuleWidgets
                  isServer={false}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          { column: "widgetId", method: "eq", value: data.id },
                        ],
                      },
                    },
                  }}
                />
              ) : null
            }
          />
        );
      }}
    />
  );
}
