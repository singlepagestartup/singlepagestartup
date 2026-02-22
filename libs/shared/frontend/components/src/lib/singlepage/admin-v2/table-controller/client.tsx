"use client";

import { IComponentProps } from "./interface";
import { Component as Child } from "./ClientComponent";

export function Component<M extends { id?: string }>(
  props: IComponentProps<M>,
) {
  return <Child {...props} />;
}
