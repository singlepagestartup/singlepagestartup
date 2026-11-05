import type { ComponentProps, ComponentType } from "react";
import { Component as AiChatDashboard } from "./singlepage/ai-chat-dashboard/index";
import { Component as AiChatLanding } from "./singlepage/ai-chat-landing/index";
const variants = {
  "ai-chat-dashboard": AiChatDashboard,
  "ai-chat-landing": AiChatLanding,
};
type Props = {
  [V in keyof typeof variants]: { variant: V } & ComponentProps<
    (typeof variants)[V]
  >;
}[keyof typeof variants];
export function Component(props: Props) {
  const View = variants[props.variant] as ComponentType<Props>;
  return <View {...props} />;
}
