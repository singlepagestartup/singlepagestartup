import type { ComponentProps } from "react";
import { Component as AiChatLogin } from "./singlepage/ai-chat-login/index";
import { Component as AiChatRegister } from "./singlepage/ai-chat-register/index";

export type IComponentProps =
  | ({ variant: "ai-chat-login" } & ComponentProps<typeof AiChatLogin>)
  | ({ variant: "ai-chat-register" } & ComponentProps<typeof AiChatRegister>);

export function Component(props: IComponentProps) {
  switch (props.variant) {
    case "ai-chat-login": {
      const { variant, ...data } = props;
      return <AiChatLogin {...data} />;
    }
    case "ai-chat-register": {
      const { variant, ...data } = props;
      return <AiChatRegister {...data} />;
    }
  }
}
