import React from "react";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-utils-client";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="sps-website-builder"
      data-model="pages-to-layouts"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className)}
    >
      <p className="font-bold">Generated variant</p>
      <p className="font-bold text-4xl">Relation: pages-to-layouts</p>
      <p className="font-bold text-4xl">Variant: default</p>
    </div>
  );
}
