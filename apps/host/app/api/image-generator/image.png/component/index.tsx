import React from "react";
import { IComponentProps } from "./interface";
import { variants } from "./variants";

export function Component(props: IComponentProps) {
  if (!Object.hasOwn(variants, props.variant)) {
    return <div />;
  }
  const Variant = variants[
    props.variant
  ] as React.ComponentType<IComponentProps>;
  return <Variant {...props} />;
}
