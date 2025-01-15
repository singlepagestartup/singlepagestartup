import { IComponentPropsExtended } from "./interface";
import { Component as SpsFileStorageWidget } from "@sps/file-storage/models/widget/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="website-builder"
      data-relation="logotypes-to-file-storage-module-widgets"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className)}
    >
      <SpsFileStorageWidget
        isServer={props.isServer}
        hostUrl={props.hostUrl}
        variant="default"
        data={{ id: props.data.fileStorageModuleWidgetId }}
      />
    </div>
  );
}
