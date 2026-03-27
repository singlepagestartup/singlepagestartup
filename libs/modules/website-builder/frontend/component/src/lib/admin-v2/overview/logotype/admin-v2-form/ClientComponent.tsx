"use client";

import { Component as ParentComponent } from "@sps/website-builder/models/logotype/frontend/component";
import { Component as LogotypesToFileStorageModuleWidgets } from "@sps/website-builder/relations/logotypes-to-file-storage-module-files/frontend/component";
import { Component as WidgetsToLogotypes } from "@sps/website-builder/relations/widgets-to-logotypes/frontend/component";
import { Component as FileStorageFile } from "@sps/file-storage/models/file/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Logotype } from "../";
import { Component as Widget } from "../../widget";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      logotypesToFileStorageModuleWidgets={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <LogotypesToFileStorageModuleWidgets
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Logotype"
            rightModelAdminFormLabel="File"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Logotype
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.logotypeId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <FileStorageFile
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.fileStorageModuleFileId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "logotypeId",
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
      widgetsToLogotypes={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <WidgetsToLogotypes
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Widget"
            rightModelAdminFormLabel="Logotype"
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
                <Logotype
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.logotypeId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "logotypeId",
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
