"use client";

import { Component as WidgetsToWebsiteBuilderModuleWidgets } from "@sps/social/relations/widgets-to-website-builder-module-widgets/frontend/component";

import { Component as ParentComponent } from "@sps/social/models/widget/frontend/component";
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
