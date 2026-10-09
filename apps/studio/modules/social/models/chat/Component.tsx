import type { ComponentProps } from "react";
import { Component as AiChatNavigation } from "./singlepage/ai-chat-navigation/index";
import { Component as AiChatPreview } from "./singlepage/ai-chat-preview/index";
import { Component as AiChatProducts } from "./singlepage/ai-chat-products/index";

export type IComponentProps =
  | ({ variant: "ai-chat-navigation" } & ComponentProps<
      typeof AiChatNavigation
    >)
  | ({ variant: "ai-chat-preview" } & ComponentProps<typeof AiChatPreview>)
  | ({ variant: "ai-chat-products" } & ComponentProps<typeof AiChatProducts>);

export function Component(props: IComponentProps) {
  switch (props.variant) {
    case "ai-chat-navigation": {
      const { variant, ...data } = props;
      return <AiChatNavigation {...data} />;
    }
    case "ai-chat-preview": {
      const { variant, ...data } = props;
      return <AiChatPreview {...data} />;
    }
    case "ai-chat-products": {
      const { variant, ...data } = props;
      return <AiChatProducts {...data} />;
    }
  }
}
