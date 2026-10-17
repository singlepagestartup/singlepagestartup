import type { ComponentProps, ComponentType } from "react";
import { Component as CheckoutTokensAiChat } from "./singlepage/checkout/tokens/ai-chat/index";
const variants = { "checkout-tokens-ai-chat": CheckoutTokensAiChat };
type Props = {
  [V in keyof typeof variants]: { variant: V } & ComponentProps<
    (typeof variants)[V]
  >;
}[keyof typeof variants];
export function Component(props: Props) {
  const View = variants[props.variant] as ComponentType<Props>;
  return <View {...props} />;
}
