import React from "react";

export { type IComponentProps } from "./interface";
import { IComponentProps } from "./interface";
import Server from "./server";

export function Component(props: IComponentProps) {
  return <Server {...props} />;
}
