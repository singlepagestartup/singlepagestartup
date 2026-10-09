import type { ComponentProps } from "react";
import { Component as AiChat } from "./singlepage/ai-chat/index";
import { Component as AiChatHelp } from "./singlepage/ai-chat-help/index";
import { Component as AiChatLogin } from "./singlepage/ai-chat-login/index";
import { Component as AiChatProjectsNew } from "./singlepage/ai-chat-projects-new/index";
import { Component as AiChatProjectsProjectId } from "./singlepage/ai-chat-projects-project-id/index";
import { Component as AiChatProjectsProjectIdSettings } from "./singlepage/ai-chat-projects-project-id-settings/index";
import { Component as AiChatProjectsProjectIdThreadsNew } from "./singlepage/ai-chat-projects-project-id-threads-new/index";
import { Component as AiChatRegister } from "./singlepage/ai-chat-register/index";
import { Component as AiChatSettings } from "./singlepage/ai-chat-settings/index";
import { Component as AiChatTokens } from "./singlepage/ai-chat-tokens/index";

export type IComponentProps =
  | ({ variant: "ai-chat" } & ComponentProps<typeof AiChat>)
  | ({ variant: "ai-chat-help" } & ComponentProps<typeof AiChatHelp>)
  | ({ variant: "ai-chat-login" } & ComponentProps<typeof AiChatLogin>)
  | ({ variant: "ai-chat-projects-new" } & ComponentProps<
      typeof AiChatProjectsNew
    >)
  | ({ variant: "ai-chat-projects-project-id" } & ComponentProps<
      typeof AiChatProjectsProjectId
    >)
  | ({ variant: "ai-chat-projects-project-id-settings" } & ComponentProps<
      typeof AiChatProjectsProjectIdSettings
    >)
  | ({ variant: "ai-chat-projects-project-id-threads-new" } & ComponentProps<
      typeof AiChatProjectsProjectIdThreadsNew
    >)
  | ({ variant: "ai-chat-register" } & ComponentProps<typeof AiChatRegister>)
  | ({ variant: "ai-chat-settings" } & ComponentProps<typeof AiChatSettings>)
  | ({ variant: "ai-chat-tokens" } & ComponentProps<typeof AiChatTokens>);

export function Component(props: IComponentProps) {
  switch (props.variant) {
    case "ai-chat": {
      const { variant, ...data } = props;
      return <AiChat {...data} />;
    }
    case "ai-chat-help": {
      const { variant, ...data } = props;
      return <AiChatHelp {...data} />;
    }
    case "ai-chat-login": {
      const { variant, ...data } = props;
      return <AiChatLogin {...data} />;
    }
    case "ai-chat-projects-new": {
      const { variant, ...data } = props;
      return <AiChatProjectsNew {...data} />;
    }
    case "ai-chat-projects-project-id": {
      const { variant, ...data } = props;
      return <AiChatProjectsProjectId {...data} />;
    }
    case "ai-chat-projects-project-id-settings": {
      const { variant, ...data } = props;
      return <AiChatProjectsProjectIdSettings {...data} />;
    }
    case "ai-chat-projects-project-id-threads-new": {
      const { variant, ...data } = props;
      return <AiChatProjectsProjectIdThreadsNew {...data} />;
    }
    case "ai-chat-register": {
      const { variant, ...data } = props;
      return <AiChatRegister {...data} />;
    }
    case "ai-chat-settings": {
      const { variant, ...data } = props;
      return <AiChatSettings {...data} />;
    }
    case "ai-chat-tokens": {
      const { variant, ...data } = props;
      return <AiChatTokens {...data} />;
    }
  }
}
