import type { ComponentProps, ComponentType } from "react";
import { Component as MessageListAiChat } from "./singlepage/message/list/ai-chat/index";
import { Component as CreateAiChat } from "./singlepage/create/ai-chat/index";
import { Component as OverviewAiChat } from "./singlepage/overview/ai-chat/index";
const variants = {
  "message-list-ai-chat": MessageListAiChat,
  "create-ai-chat": CreateAiChat,
  "overview-ai-chat": OverviewAiChat,
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
