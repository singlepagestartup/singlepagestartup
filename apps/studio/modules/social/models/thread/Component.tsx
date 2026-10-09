import type { ComponentProps } from "react";
import { Component as AiChatComposer } from "./singlepage/ai-chat-composer/index";
import { Component as AiChatConversation } from "./singlepage/ai-chat-conversation/index";
import { Component as AiChatCreate } from "./singlepage/ai-chat-create/index";
import { Component as AiChatProducts } from "./singlepage/ai-chat-products/index";
import { Component as AiChatSettings } from "./singlepage/ai-chat-settings/index";
import { Component as AiChatSidebarItem } from "./singlepage/ai-chat-sidebar-item/index";

export type IComponentProps =
  | ({ variant: "ai-chat-composer" } & ComponentProps<typeof AiChatComposer>)
  | ({ variant: "ai-chat-conversation" } & ComponentProps<
      typeof AiChatConversation
    >)
  | ({ variant: "ai-chat-create" } & ComponentProps<typeof AiChatCreate>)
  | ({ variant: "ai-chat-products" } & ComponentProps<typeof AiChatProducts>)
  | ({ variant: "ai-chat-settings" } & ComponentProps<typeof AiChatSettings>)
  | ({ variant: "ai-chat-sidebar-item" } & ComponentProps<
      typeof AiChatSidebarItem
    >);

export function Component(props: IComponentProps) {
  switch (props.variant) {
    case "ai-chat-composer": {
      const { variant, ...data } = props;
      return <AiChatComposer {...data} />;
    }
    case "ai-chat-conversation": {
      const { variant, ...data } = props;
      return <AiChatConversation {...data} />;
    }
    case "ai-chat-create": {
      const { variant, ...data } = props;
      return <AiChatCreate {...data} />;
    }
    case "ai-chat-products": {
      const { variant, ...data } = props;
      return <AiChatProducts {...data} />;
    }
    case "ai-chat-settings": {
      const { variant, ...data } = props;
      return <AiChatSettings {...data} />;
    }
    case "ai-chat-sidebar-item": {
      const { variant, ...data } = props;
      return <AiChatSidebarItem {...data} />;
    }
  }
}
