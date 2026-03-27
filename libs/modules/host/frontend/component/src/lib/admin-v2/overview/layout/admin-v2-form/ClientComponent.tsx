"use client";

import { Component as ParentComponent } from "@sps/host/models/layout/frontend/component";
import { Component as LayoutsToWidgets } from "@sps/host/relations/layouts-to-widgets/frontend/component";
import { Component as PagesToLayouts } from "@sps/host/relations/pages-to-layouts/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Layout } from "../";
import { Component as Page } from "../../page";
import { Component as Widget } from "../../widget";

export function Component(props: IComponentProps) {
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
                      column: "layoutId",
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
      pagesToLayouts={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <PagesToLayouts
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Page"
            rightModelAdminFormLabel="Layout"
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
                <Layout
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.layoutId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "layoutId",
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
