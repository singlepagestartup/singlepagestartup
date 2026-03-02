"use client";

import { IComponentProps } from "./interface";
import { Component as Child } from "./ClientComponent";

export function Component(props: IComponentProps) {
  return <Child {...props} />;
}
