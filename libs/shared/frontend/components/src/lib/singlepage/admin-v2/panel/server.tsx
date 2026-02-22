"use server";

import { IComponentProps } from "./interface";
import { Component as Child } from "./ClientComponent";

export async function Component(props: IComponentProps) {
  return <Child {...props} />;
}
