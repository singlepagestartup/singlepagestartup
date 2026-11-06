"use client";

import { Component as ParentComponent } from "@sps/social/models/chat/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return <ParentComponent isServer={false} variant={props.variant} />;
}
