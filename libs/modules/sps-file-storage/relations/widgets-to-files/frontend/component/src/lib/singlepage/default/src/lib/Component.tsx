import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";
import { Component as File } from "@sps/sps-file-storage/models/file/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="sps-file-storage"
      data-relation="widgets-to-files"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className || "")}
    >
      <File
        isServer={props.isServer}
        hostUrl={props.hostUrl}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.fileId,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <File
                key={index}
                isServer={props.isServer}
                hostUrl={props.hostUrl}
                data={entity}
                variant={entity.variant as any}
              />
            );
          });
        }}
      </File>
    </div>
  );
}
