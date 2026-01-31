"use client";

import { Component as ParentComponent } from "@sps/crm/models/widget/frontend/component";
import { Component as WidgetsToForms } from "@sps/crm/relations/widgets-to-forms/frontend/component";
import { Component as WidgetsToWebsiteBuilderModuleWidgets } from "@sps/crm/relations/widgets-to-website-builder-module-widgets/frontend/component";

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
            widgetsToForms={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <WidgetsToForms
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
            widgetsToWebsiteBuilderModuleWidgets={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <WidgetsToWebsiteBuilderModuleWidgets
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
