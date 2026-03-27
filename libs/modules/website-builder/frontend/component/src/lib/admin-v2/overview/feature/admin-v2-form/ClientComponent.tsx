"use client";

import { Component as ParentComponent } from "@sps/website-builder/models/feature/frontend/component";
import { Component as FeaturesToButtonsArrays } from "@sps/website-builder/relations/features-to-buttons-arrays/frontend/component";
import { Component as FeaturesToFileStorageModuleWidgets } from "@sps/website-builder/relations/features-to-file-storage-module-files/frontend/component";
import { Component as WidgetsToFeatures } from "@sps/website-builder/relations/widgets-to-features/frontend/component";
import { Component as FileStorageFile } from "@sps/file-storage/models/file/frontend/component";
import { IComponentProps } from "./interface";
import { Component as ButtonsArray } from "../../buttons-array";
import { Component as Feature } from "../";
import { Component as Widget } from "../../widget";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      widgetsToFeatures={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <WidgetsToFeatures
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Widget"
            rightModelAdminFormLabel="Feature"
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
                <Feature
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.featureId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "featureId",
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
      featuresToFileStorageModuleWidgets={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <FeaturesToFileStorageModuleWidgets
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Feature"
            rightModelAdminFormLabel="File"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Feature
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.featureId } as any}
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
                      column: "featureId",
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
      featuresToButtonsArrays={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <FeaturesToButtonsArrays
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Feature"
            rightModelAdminFormLabel="Buttons array"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Feature
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.featureId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <ButtonsArray
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.buttonsArrayId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "featureId",
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
