"use client";
import { Component as WidgetsToEcommerceModuleWidgets } from "@sps/rbac/relations/widgets-to-ecommerce-module-widgets/frontend/component";

import { Component as ParentComponent } from "@sps/rbac/models/widget/frontend/component";

import { Component as WidgetsToWebsiteBuilderModuleWidgets } from "@sps/rbac/relations/widgets-to-website-builder-module-widgets/frontend/component";

import { Component as WidgetsToCrmModuleWidgets } from "@sps/rbac/relations/widgets-to-crm-module-widgets/frontend/component";

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
            widgetsToEcommerceModuleWidgets={({ data }) =>
              data ? (
                <WidgetsToEcommerceModuleWidgets
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
            widgetsToCrmModuleWidgets={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <WidgetsToCrmModuleWidgets
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
