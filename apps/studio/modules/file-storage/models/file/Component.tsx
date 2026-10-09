import type { ComponentProps } from "react";
import { Component as AiChatAsset } from "./singlepage/ai-chat-asset/index";
import { Component as AiChatAttachments } from "./singlepage/ai-chat-attachments/index";
import { Component as AiChatPending } from "./singlepage/ai-chat-pending/index";
import { Component as AiChatPreview } from "./singlepage/ai-chat-preview/index";

export type IComponentProps =
  | ({ variant: "ai-chat-asset" } & ComponentProps<typeof AiChatAsset>)
  | ({ variant: "ai-chat-attachments" } & ComponentProps<
      typeof AiChatAttachments
    >)
  | ({ variant: "ai-chat-pending" } & ComponentProps<typeof AiChatPending>)
  | ({ variant: "ai-chat-preview" } & ComponentProps<typeof AiChatPreview>);

export function Component(props: IComponentProps) {
  switch (props.variant) {
    case "ai-chat-asset": {
      const { variant, ...data } = props;
      return <AiChatAsset {...data} />;
    }
    case "ai-chat-attachments": {
      const { variant, ...data } = props;
      return <AiChatAttachments {...data} />;
    }
    case "ai-chat-pending": {
      const { variant, ...data } = props;
      return <AiChatPending {...data} />;
    }
    case "ai-chat-preview": {
      const { variant, ...data } = props;
      return <AiChatPreview {...data} />;
    }
  }
}
