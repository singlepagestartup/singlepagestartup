"use client";

import { Component as ParentComponent } from "@sps/file-storage/models/widget/frontend/component";
import { Component as WidgetsToFiles } from "@sps/file-storage/relations/widgets-to-files/frontend/component";
import { IComponentProps } from "./interface";
import { Component as File } from "../../file";
import { Component as Widget } from "../";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      widgetsToFiles={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <WidgetsToFiles
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Widget"
            rightModelAdminFormLabel="File"
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
                <File
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.fileId } as any}
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
