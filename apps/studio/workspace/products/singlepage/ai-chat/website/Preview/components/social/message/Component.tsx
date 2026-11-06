import type { ComponentProps, ComponentType } from "react";
import { Component as ListAiChat } from "./singlepage/list/ai-chat/index";
const variants = { "list-ai-chat": ListAiChat };
type Props = {
  [V in keyof typeof variants]: { variant: V } & ComponentProps<
    (typeof variants)[V]
  >;
}[keyof typeof variants];
export function Component(props: Props) {
  const View = variants[props.variant] as ComponentType<Props>;
  return <View {...props} />;
}
