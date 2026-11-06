import type { ComponentProps, ComponentType } from "react";
import { Component as CardDefault } from "./singlepage/card-default/index";
const variants = { "card-default": CardDefault };
type Props = {
  [V in keyof typeof variants]: { variant: V } & ComponentProps<
    (typeof variants)[V]
  >;
}[keyof typeof variants];
export function Component(props: Props) {
  const View = variants[props.variant] as ComponentType<Props>;
  return <View {...props} />;
}
