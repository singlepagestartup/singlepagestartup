import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as FileStorageModuleFile } from "@sps/file-storage/models/file/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="host"
      data-relation="metadata-to-file-storage-module-files"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <FileStorageModuleFile
        variant="find"
        isServer={props.isServer}
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.fileStorageModuleFileId,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity) => {
            return (
              <FileStorageModuleFile
                key={entity.id}
                isServer={props.isServer}
                variant={entity.variant as any}
                dataSource="props"
                data={entity}
                language={props.language}
              >
                {props.children}
              </FileStorageModuleFile>
            );
          });
        }}
      </FileStorageModuleFile>
    </div>
  );
}
