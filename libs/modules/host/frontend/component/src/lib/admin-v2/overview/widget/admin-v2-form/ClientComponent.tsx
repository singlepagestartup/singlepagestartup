"use client";

import { Component as ParentComponent } from "@sps/host/models/widget/frontend/component";
import { Component as LayoutsToWidgets } from "@sps/host/relations/layouts-to-widgets/frontend/component";
import { Component as PagesToWidgets } from "@sps/host/relations/pages-to-widgets/frontend/component";
import { Component as WidgetsToExternalWidgets } from "@sps/host/relations/widgets-to-external-widgets/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Layout } from "../../layout";
import { Component as Page } from "../../page";
import { Component as Widget } from "../";
import { Component as AnalyticWidget } from "@sps/analytic/models/widget/frontend/component";
import { Component as BillingWidget } from "@sps/billing/models/widget/frontend/component";
import { Component as BlogWidget } from "@sps/blog/models/widget/frontend/component";
import { Component as CrmWidget } from "@sps/crm/models/widget/frontend/component";
import { Component as EcommerceWidget } from "@sps/ecommerce/models/widget/frontend/component";
import { Component as FileStorageWidget } from "@sps/file-storage/models/widget/frontend/component";
import { Component as NotificationWidget } from "@sps/notification/models/widget/frontend/component";
import { Component as RbacWidget } from "@sps/rbac/models/widget/frontend/component";
import { Component as SocialWidget } from "@sps/social/models/widget/frontend/component";
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
      case "analytic":
        return <AnalyticWidget {...commonProps} />;
      case "billing":
        return <BillingWidget {...commonProps} />;
      case "blog":
        return <BlogWidget {...commonProps} />;
      case "crm":
        return <CrmWidget {...commonProps} />;
      case "ecommerce":
        return <EcommerceWidget {...commonProps} />;
      case "file-storage":
        return <FileStorageWidget {...commonProps} />;
      case "notification":
        return <NotificationWidget {...commonProps} />;
      case "rbac":
        return <RbacWidget {...commonProps} />;
      case "social":
        return <SocialWidget {...commonProps} />;
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
      layoutsToWidgets={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <LayoutsToWidgets
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Layout"
            rightModelAdminFormLabel="Widget"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Layout
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.layoutId } as any}
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
