import type { ComponentProps } from "react";
import { Component as AiChatAgent } from "./singlepage/ai-chat-agent/index";
import { Component as AiChatAgentAvatar } from "./singlepage/ai-chat-agent-avatar/index";
import { Component as AiChatAgentSelect } from "./singlepage/ai-chat-agent-select/index";
import { Component as AiChatCreate } from "./singlepage/ai-chat-create/index";
import { Component as AiChatProject } from "./singlepage/ai-chat-project/index";
import { Component as AiChatProjectItem } from "./singlepage/ai-chat-project-item/index";
import { Component as AiChatProjectSelect } from "./singlepage/ai-chat-project-select/index";
import { Component as AiChatSettings } from "./singlepage/ai-chat-settings/index";
import { Component as AiChatSidebar } from "./singlepage/ai-chat-sidebar/index";
import { Component as AiChatUserMenu } from "./singlepage/ai-chat-user-menu/index";

export type IComponentProps =
  | ({ variant: "ai-chat-agent" } & ComponentProps<typeof AiChatAgent>)
  | ({ variant: "ai-chat-agent-avatar" } & ComponentProps<
      typeof AiChatAgentAvatar
    >)
  | ({ variant: "ai-chat-agent-select" } & ComponentProps<
      typeof AiChatAgentSelect
    >)
  | ({ variant: "ai-chat-create" } & ComponentProps<typeof AiChatCreate>)
  | ({ variant: "ai-chat-project" } & ComponentProps<typeof AiChatProject>)
  | ({ variant: "ai-chat-project-item" } & ComponentProps<
      typeof AiChatProjectItem
    >)
  | ({ variant: "ai-chat-project-select" } & ComponentProps<
      typeof AiChatProjectSelect
    >)
  | ({ variant: "ai-chat-settings" } & ComponentProps<typeof AiChatSettings>)
  | ({ variant: "ai-chat-sidebar" } & ComponentProps<typeof AiChatSidebar>)
  | ({ variant: "ai-chat-user-menu" } & ComponentProps<typeof AiChatUserMenu>);

export function Component(props: IComponentProps) {
  switch (props.variant) {
    case "ai-chat-agent": {
      const { variant, ...data } = props;
      return <AiChatAgent {...data} />;
    }
    case "ai-chat-agent-avatar": {
      const { variant, ...data } = props;
      return <AiChatAgentAvatar {...data} />;
    }
    case "ai-chat-agent-select": {
      const { variant, ...data } = props;
      return <AiChatAgentSelect {...data} />;
    }
    case "ai-chat-create": {
      const { variant, ...data } = props;
      return <AiChatCreate {...data} />;
    }
    case "ai-chat-project": {
      const { variant, ...data } = props;
      return <AiChatProject {...data} />;
    }
    case "ai-chat-project-item": {
      const { variant, ...data } = props;
      return <AiChatProjectItem {...data} />;
    }
    case "ai-chat-project-select": {
      const { variant, ...data } = props;
      return <AiChatProjectSelect {...data} />;
    }
    case "ai-chat-settings": {
      const { variant, ...data } = props;
      return <AiChatSettings {...data} />;
    }
    case "ai-chat-sidebar": {
      const { variant, ...data } = props;
      return <AiChatSidebar {...data} />;
    }
    case "ai-chat-user-menu": {
      const { variant, ...data } = props;
      return <AiChatUserMenu {...data} />;
    }
  }
}
