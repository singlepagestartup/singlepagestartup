"use client";
import "client-only";

import { Component as ChildComponent } from "./Component";
import { IComponentProps } from "./interface";

export default function Component(props: IComponentProps) {
  return <ChildComponent {...props} />;
}
