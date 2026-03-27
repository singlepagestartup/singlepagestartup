"use client";

import { Component as ParentComponent } from "@sps/rbac/models/widget/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
    />
  );
}
