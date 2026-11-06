import type { ComponentProps, ComponentType } from "react";
import { Component as BrandAiChat } from "./singlepage/brand/ai-chat/index";
const variants = { "brand-ai-chat": BrandAiChat };
type Props = {
  [V in keyof typeof variants]: { variant: V } & ComponentProps<
    (typeof variants)[V]
  >;
}[keyof typeof variants];
export function Component(props: Props) {
  const View = variants[props.variant] as ComponentType<Props>;
  return <View {...props} />;
}
