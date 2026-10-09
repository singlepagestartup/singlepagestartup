import type { ComponentProps } from "react";
import { Component as AiChatProducts } from "./singlepage/ai-chat-products/index";

export type IComponentProps = { variant: "ai-chat-products" } & ComponentProps<
  typeof AiChatProducts
>;

export function Component(props: IComponentProps) {
  switch (props.variant) {
    case "ai-chat-products": {
      const { variant, ...data } = props;
      return <AiChatProducts {...data} />;
    }
  }
}
