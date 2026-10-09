import type { ComponentProps } from "react";
import { Component as AiChat } from "./singlepage/ai-chat/index";
import { Component as AiChatHeader } from "./singlepage/ai-chat-header/index";
import { Component as AiChatProject } from "./singlepage/ai-chat-project/index";

export type IComponentProps =
  | ({ variant: "ai-chat" } & ComponentProps<typeof AiChat>)
  | ({ variant: "ai-chat-header" } & ComponentProps<typeof AiChatHeader>)
  | ({ variant: "ai-chat-project" } & ComponentProps<typeof AiChatProject>);

export function Component(props: IComponentProps) {
  switch (props.variant) {
    case "ai-chat": {
      const { variant, ...data } = props;
      return <AiChat {...data} />;
    }
    case "ai-chat-header": {
      const { variant, ...data } = props;
      return <AiChatHeader {...data} />;
    }
    case "ai-chat-project": {
      const { variant, ...data } = props;
      return <AiChatProject {...data} />;
    }
  }
}
