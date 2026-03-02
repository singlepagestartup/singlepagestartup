"use client";

import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return <>{props.children ?? null}</>;
}
