import type { ComponentProps, ComponentType } from "react";
import { Component as OverviewAiChat } from "./singlepage/overview/ai-chat/index";
const variants = { "overview-ai-chat": OverviewAiChat };
type Props = {
  [V in keyof typeof variants]: { variant: V } & ComponentProps<
    (typeof variants)[V]
  >;
}[keyof typeof variants];
export function Component(props: Props) {
  const View = variants[props.variant] as ComponentType<Props>;
  return <View {...props} />;
}
