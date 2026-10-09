import type { ComponentProps } from "react";
import { Component as AiChatAccount } from "./singlepage/ai-chat-account/index";
import { Component as AiChatSettings } from "./singlepage/ai-chat-settings/index";

export type IComponentProps =
  | ({ variant: "ai-chat-account" } & ComponentProps<typeof AiChatAccount>)
  | ({ variant: "ai-chat-settings" } & ComponentProps<typeof AiChatSettings>);

export function Component(props: IComponentProps) {
  switch (props.variant) {
    case "ai-chat-account": {
      const { variant, ...data } = props;
      return <AiChatAccount {...data} />;
    }
    case "ai-chat-settings": {
      const { variant, ...data } = props;
      return <AiChatSettings {...data} />;
    }
  }
}
