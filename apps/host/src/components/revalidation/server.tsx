"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { Component as Child } from "./Component";

export async function Component(props: IComponentProps) {
  return <Child {...props} />;
}
