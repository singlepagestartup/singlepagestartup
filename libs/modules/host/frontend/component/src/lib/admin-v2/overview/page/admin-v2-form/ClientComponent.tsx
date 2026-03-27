"use client";

import { Component as ParentComponent } from "@sps/host/models/page/frontend/component";
import { Component as PagesToLayouts } from "@sps/host/relations/pages-to-layouts/frontend/component";
import { Component as PagesToMetadata } from "@sps/host/relations/pages-to-metadata/frontend/component";
import { Component as PagesToWidgets } from "@sps/host/relations/pages-to-widgets/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Layout } from "../../layout";
import { Component as Metadata } from "../../metadata";
import { Component as Page } from "../";
import { Component as Widget } from "../../widget";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
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
                      column: "pageId",
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
      pagesToMetadata={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <PagesToMetadata
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Page"
            rightModelAdminFormLabel="Metadata"
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
                <Metadata
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.metadataId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "pageId",
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
                      column: "pageId",
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
