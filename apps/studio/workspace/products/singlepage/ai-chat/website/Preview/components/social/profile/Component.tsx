import type { ComponentProps, ComponentType } from "react";
import { Component as SelectAiChatProject } from "./singlepage/select/ai-chat/project/index";
import { Component as CreateAiChatProject } from "./singlepage/create/ai-chat/project/index";
import { Component as ProcessingAiChatProject } from "./singlepage/processing/ai-chat/project/index";
import { Component as OverviewAiChatProject } from "./singlepage/overview/ai-chat/project/index";
import { Component as SettingsAiChatProject } from "./singlepage/settings/ai-chat/project/index";
import { Component as AccountMenu } from "./singlepage/account-menu/index";
import { Component as AgentSelectAiChat } from "./singlepage/agent/select/ai-chat/index";
import { Component as AgentOverviewAiChat } from "./singlepage/agent/overview/ai-chat/index";
import { Component as AgentAvatarAiChat } from "./singlepage/agent/avatar/ai-chat/index";
const variants = {
  "select-ai-chat-project": SelectAiChatProject,
  "create-ai-chat-project": CreateAiChatProject,
  "processing-ai-chat-project": ProcessingAiChatProject,
  "overview-ai-chat-project": OverviewAiChatProject,
  "settings-ai-chat-project": SettingsAiChatProject,
  "account-menu": AccountMenu,
  "agent-select-ai-chat": AgentSelectAiChat,
  "agent-overview-ai-chat": AgentOverviewAiChat,
  "agent-avatar-ai-chat": AgentAvatarAiChat,
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
