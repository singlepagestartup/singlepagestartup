import type { ComponentProps } from "react";
import { Component as AiChatCard } from "./singlepage/ai-chat-card/index";
import { Component as AiChatDocument } from "./singlepage/ai-chat-document/index";
import { Component as AiChatDocumentLink } from "./singlepage/ai-chat-document-link/index";

export type IComponentProps =
  | ({ variant: "ai-chat-card" } & ComponentProps<typeof AiChatCard>)
  | ({ variant: "ai-chat-document" } & ComponentProps<typeof AiChatDocument>)
  | ({ variant: "ai-chat-document-link" } & ComponentProps<
      typeof AiChatDocumentLink
    >);

export function Component(props: IComponentProps) {
  switch (props.variant) {
    case "ai-chat-card": {
      const { variant, ...data } = props;
      return <AiChatCard {...data} />;
    }
    case "ai-chat-document": {
      const { variant, ...data } = props;
      return <AiChatDocument {...data} />;
    }
    case "ai-chat-document-link": {
      const { variant, ...data } = props;
      return <AiChatDocumentLink {...data} />;
    }
  }
}
