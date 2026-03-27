"use client";

import { Component as ParentComponent } from "@sps/telegram/models/widget/frontend/component";
import { Component as PagesToWidgets } from "@sps/telegram/relations/pages-to-widgets/frontend/component";
import { Component as WidgetsToExternalWidgets } from "@sps/telegram/relations/widgets-to-external-widgets/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Page } from "../../page";
import { Component as Widget } from "../";
import { Component as BillingWidget } from "@sps/billing/models/widget/frontend/component";
import { Component as BlogWidget } from "@sps/blog/models/widget/frontend/component";
import { Component as EcommerceWidget } from "@sps/ecommerce/models/widget/frontend/component";
import { Component as RbacWidget } from "@sps/rbac/models/widget/frontend/component";
import { Component as StartupWidget } from "@sps/startup/models/widget/frontend/component";
import { Component as WebsiteBuilderWidget } from "@sps/website-builder/models/widget/frontend/component";

export function Component(props: IComponentProps) {
  function renderExternalWidgetForm(data: {
    externalModule?: string;
    externalWidgetId?: string;
  }) {
    if (!data.externalWidgetId) {
      return null;
    }

    const commonProps = {
      isServer: false,
      variant: "admin-v2-form" as const,
      data: { id: data.externalWidgetId } as any,
    };

    switch (data.externalModule) {
      case "billing":
        return <BillingWidget {...commonProps} />;
      case "blog":
        return <BlogWidget {...commonProps} />;
      case "ecommerce":
        return <EcommerceWidget {...commonProps} />;
      case "rbac":
        return <RbacWidget {...commonProps} />;
      case "startup":
        return <StartupWidget {...commonProps} />;
      case "website-builder":
        return <WebsiteBuilderWidget {...commonProps} />;
      default:
        return null;
    }
  }

  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      pagesToWidgets={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <PagesToWidgets
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Page"
            rightModelAdminFormLabel="Widget"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Page
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.pageId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
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
      widgetsToExternalModules={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <WidgetsToExternalWidgets
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Widget"
            rightModelAdminFormLabel="External Widget"
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

              return renderExternalWidgetForm(data);
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
