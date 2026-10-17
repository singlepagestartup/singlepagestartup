import type { ComponentProps, ComponentType } from "react";
import { Component as Default } from "./singlepage/default/index";
import { Component as NavbarAiChat } from "./singlepage/navbar/ai-chat/index";
const variants = { default: Default, "navbar-ai-chat": NavbarAiChat };
type Props = {
  [V in keyof typeof variants]: { variant: V } & ComponentProps<
    (typeof variants)[V]
  >;
}[keyof typeof variants];
export function Component(props: Props) {
  const View = variants[props.variant] as ComponentType<Props>;
  return <View {...props} />;
}
