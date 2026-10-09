import type { ComponentProps } from "react";
import { Component as AiChat } from "./singlepage/ai-chat/index";

export type IComponentProps = { variant: "ai-chat" } & ComponentProps<
  typeof AiChat
>;

export function Component(props: IComponentProps) {
  switch (props.variant) {
    case "ai-chat": {
      const { variant, ...data } = props;
      return <AiChat {...data} />;
    }
  }
}
