"use client";

import { Component as ParentComponent } from "@sps/telegram/models/page/frontend/component";
import { Component as PagesToWidgets } from "@sps/telegram/relations/pages-to-widgets/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Page } from "../";
import { Component as Widget } from "../../widget";

export function Component(props: IComponentProps) {
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
