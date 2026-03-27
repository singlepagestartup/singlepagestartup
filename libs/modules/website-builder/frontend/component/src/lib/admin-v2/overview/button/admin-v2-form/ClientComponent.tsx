"use client";

import { Component as ParentComponent } from "@sps/website-builder/models/button/frontend/component";
import { Component as ButtonsArraysToButtons } from "@sps/website-builder/relations/buttons-arrays-to-buttons/frontend/component";
import { Component as ButtonsToSpsFileStorageModuleWidgets } from "@sps/website-builder/relations/buttons-to-file-storage-module-files/frontend/component";
import { Component as FileStorageFile } from "@sps/file-storage/models/file/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Button } from "../";
import { Component as ButtonsArray } from "../../buttons-array";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      buttonsArraysToButtons={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ButtonsArraysToButtons
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Buttons array"
            rightModelAdminFormLabel="Button"
            leftModelAdminForm={({ data }) => {
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
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Button
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.buttonId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "buttonId",
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
      buttonsSpsFileStorageModuleWidgets={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ButtonsToSpsFileStorageModuleWidgets
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Button"
            rightModelAdminFormLabel="File"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Button
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.buttonId } as any}
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
                      column: "buttonId",
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
