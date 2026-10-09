import type { ComponentProps } from "react";
import { Component as AiChatMessage } from "./singlepage/ai-chat-message/index";

export type IComponentProps = { variant: "ai-chat-message" } & ComponentProps<
  typeof AiChatMessage
>;

export function Component(props: IComponentProps) {
  switch (props.variant) {
    case "ai-chat-message": {
      const { variant, ...data } = props;
      return <AiChatMessage {...data} />;
    }
  }
}
