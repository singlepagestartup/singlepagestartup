import React from "react";
import { IComponentPropsExtended } from "./interface";
import { Component as WidgetsToFiles } from "@sps/sps-file-storage-relations-widgets-to-files-frontend-component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="sps-file-storage"
      data-model="widget"
      data-variant={props.variant}
      className="w-full flex"
    >
      {props.data.widgetsToFiles.map((entity, index) => {
        return (
          <WidgetsToFiles
            key={index}
            isServer={props.isServer}
            variant="default"
            data={entity}
          />
        );
      })}
    </div>
  );
}
