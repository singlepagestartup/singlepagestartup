"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";

export default async function Component(props: IComponentProps) {
  return <ChildComponent {...props} />;
}
