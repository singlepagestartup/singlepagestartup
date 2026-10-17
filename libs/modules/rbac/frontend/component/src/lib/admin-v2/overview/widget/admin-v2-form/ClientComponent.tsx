"use client";
import { Component as WidgetsToWebsiteBuilderModuleWidgets } from "@sps/rbac/relations/widgets-to-website-builder-module-widgets/frontend/component";
import { Component as WidgetsToCrmModuleWidgets } from "@sps/rbac/relations/widgets-to-crm-module-widgets/frontend/component";

import { Component as ParentComponent } from "@sps/rbac/models/widget/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      widgetsToWebsiteBuilderModuleWidgets={({ data }) =>
        data ? (
          <WidgetsToWebsiteBuilderModuleWidgets
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="RBAC Widget"
            rightModelAdminFormLabel="Website Builder Widget"
            apiProps={{
              params: {
                filters: {
                  and: [{ column: "widgetId", method: "eq", value: data.id }],
                },
              },
            }}
          />
        ) : null
      }
      widgetsToCrmModuleWidgets={({ data }) =>
        data ? (
          <WidgetsToCrmModuleWidgets
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="RBAC Widget"
            rightModelAdminFormLabel="CRM Widget"
            apiProps={{
              params: {
                filters: {
                  and: [{ column: "widgetId", method: "eq", value: data.id }],
                },
              },
            }}
          />
        ) : null
      }
    />
  );
}
