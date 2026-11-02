import type { ComponentProps, ComponentType } from "react";
import { Component as ContentAiChatHelp } from "./singlepage/content/ai-chat/help/index";
import { Component as ContentAiChatHero } from "./singlepage/content/ai-chat/hero/index";
import { Component as ContentAiChatTry } from "./singlepage/content/ai-chat/try/index";
import { Component as ContentAiChatContinue } from "./singlepage/content/ai-chat/continue/index";
import { Component as NavbarAiChat } from "./singlepage/navbar/ai-chat/index";
import { Component as FooterAiChat } from "./singlepage/footer/ai-chat/index";
import { Component as NavbarAiChatLanding } from "./singlepage/navbar/ai-chat-landing/index";
const variants = {
  "content-ai-chat-help": ContentAiChatHelp,
  "content-ai-chat-hero": ContentAiChatHero,
  "content-ai-chat-try": ContentAiChatTry,
  "content-ai-chat-continue": ContentAiChatContinue,
  "navbar-ai-chat": NavbarAiChat,
  "footer-ai-chat": FooterAiChat,
  "navbar-ai-chat-landing": NavbarAiChatLanding,
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
