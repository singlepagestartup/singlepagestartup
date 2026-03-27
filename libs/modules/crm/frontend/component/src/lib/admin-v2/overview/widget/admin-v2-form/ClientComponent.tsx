"use client";

import { Component as ParentComponent } from "@sps/crm/models/widget/frontend/component";
import { Component as WidgetsToForms } from "@sps/crm/relations/widgets-to-forms/frontend/component";
import { Component as WidgetsToWebsiteBuilderModuleWidgets } from "@sps/crm/relations/widgets-to-website-builder-module-widgets/frontend/component";
import { Component as WebsiteBuilderWidget } from "@sps/website-builder/models/widget/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Form } from "../../form";
import { Component as Widget } from "../";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      widgetsToForms={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <WidgetsToForms
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Widget"
            rightModelAdminFormLabel="Form"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Widget
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.widgetId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Form
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.formId } as any}
                />
              );
            }}
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
      widgetsToWebsiteBuilderModuleWidgets={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <WidgetsToWebsiteBuilderModuleWidgets
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Widget"
            rightModelAdminFormLabel="Website widget"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Widget
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.widgetId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <WebsiteBuilderWidget
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.websiteBuilderModuleWidgetId } as any}
                />
              );
            }}
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
}
