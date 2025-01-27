import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as FileStorageFile } from "@sps/file-storage/models/file/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="website-builder"
      data-relation="widgets-to-file-storage-module-widgets"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className)}
    >
      <FileStorageFile
        isServer={props.isServer}
        variant="find"
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
          return data?.map((entity, index) => {
            return (
              <FileStorageFile
                key={index}
                isServer={props.isServer}
                variant={entity.variant as any}
                data={entity}
              />
            );
          });
        }}
      </FileStorageFile>
    </div>
  );
}
