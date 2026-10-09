import type { ComponentProps } from "react";
import { Component as AiChatTokens } from "./singlepage/ai-chat-tokens/index";

export type IComponentProps = { variant: "ai-chat-tokens" } & ComponentProps<
  typeof AiChatTokens
>;

export function Component(props: IComponentProps) {
  switch (props.variant) {
    case "ai-chat-tokens": {
      const { variant, ...data } = props;
      return <AiChatTokens {...data} />;
    }
  }
}
