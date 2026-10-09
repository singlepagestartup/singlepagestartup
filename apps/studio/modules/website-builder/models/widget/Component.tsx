import type { ComponentProps } from "react";
import { Component as AiChatHeader } from "./singlepage/ai-chat-header/index";
import { Component as AiChatHelp } from "./singlepage/ai-chat-help/index";
import { Component as AiChatLanding } from "./singlepage/ai-chat-landing/index";

export type IComponentProps =
  | ({ variant: "ai-chat-header" } & ComponentProps<typeof AiChatHeader>)
  | ({ variant: "ai-chat-help" } & ComponentProps<typeof AiChatHelp>)
  | ({ variant: "ai-chat-landing" } & ComponentProps<typeof AiChatLanding>);

export function Component(props: IComponentProps) {
  switch (props.variant) {
    case "ai-chat-header": {
      const { variant, ...data } = props;
      return <AiChatHeader {...data} />;
    }
    case "ai-chat-help": {
      const { variant, ...data } = props;
      return <AiChatHelp {...data} />;
    }
    case "ai-chat-landing": {
      const { variant, ...data } = props;
      return <AiChatLanding {...data} />;
    }
  }
}
