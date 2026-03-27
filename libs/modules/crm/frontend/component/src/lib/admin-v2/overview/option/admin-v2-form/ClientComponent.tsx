"use client";

import { Component as ParentComponent } from "@sps/crm/models/option/frontend/component";
import { Component as InputsToOptions } from "@sps/crm/relations/inputs-to-options/frontend/component";
import { Component as OptionsToFileStorageModuleFiles } from "@sps/crm/relations/options-to-file-storage-module-files/frontend/component";
import { Component as FileStorageFile } from "@sps/file-storage/models/file/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Input } from "../../input";
import { Component as Option } from "../";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      inputsToOptions={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <InputsToOptions
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Input"
            rightModelAdminFormLabel="Option"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Input
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.inputId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Option
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.optionId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "optionId",
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
      optionsToFileStorageModuleFiles={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <OptionsToFileStorageModuleFiles
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Option"
            rightModelAdminFormLabel="File"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Option
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.optionId } as any}
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
                      column: "optionId",
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
