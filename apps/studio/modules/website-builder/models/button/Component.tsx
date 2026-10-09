import type { ComponentProps } from "react";
import { Component as AiChatHeader } from "./singlepage/ai-chat-header/index";

export type IComponentProps = { variant: "ai-chat-header" } & ComponentProps<
  typeof AiChatHeader
>;

export function Component(props: IComponentProps) {
  switch (props.variant) {
    case "ai-chat-header": {
      const { variant, ...data } = props;
      return <AiChatHeader {...data} />;
    }
  }
}
