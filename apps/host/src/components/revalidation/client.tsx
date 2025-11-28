"use client";
import "client-only";

import { IComponentPropsExtended } from "./interface";
import { Component as Child } from "./Component";

export function Component(props: IComponentPropsExtended) {
  return <Child {...props} />;
}
