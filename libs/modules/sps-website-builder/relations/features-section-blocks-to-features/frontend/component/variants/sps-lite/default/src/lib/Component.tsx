import React from "react";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-utils-client";
import { Component as Feature } from "@sps/sps-website-builder-models-feature-frontend-component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="sps-website-builder"
      data-relation="features-section-blocks-to-features"
      data-variant={props.variant}
      className={cn("w-full", props.data.className || "")}
    >
      <Feature
        isServer={props.isServer}
        variant={props.data.feature.variant}
        data={props.data.feature}
      />
    </div>
  );
}
