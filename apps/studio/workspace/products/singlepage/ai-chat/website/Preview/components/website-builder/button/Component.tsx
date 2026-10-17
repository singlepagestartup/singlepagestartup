import { forwardRef } from "react";
import type { ComponentProps, ComponentType, RefAttributes } from "react";
import { Component as Control } from "./singlepage/control/index";
import { Component as Link } from "./singlepage/link/index";
import { Component as Secondary } from "./singlepage/secondary/index";
import { Component as Primary } from "./singlepage/primary/index";
import { Component as NavbarAiChat } from "./singlepage/navbar/ai-chat/index";
const variants = {
  control: Control,
  link: Link,
  secondary: Secondary,
  primary: Primary,
  "navbar-ai-chat": NavbarAiChat,
};
type Props = {
  [V in keyof typeof variants]: { variant: V } & ComponentProps<
    (typeof variants)[V]
  >;
}[keyof typeof variants];
export const Component = forwardRef<HTMLButtonElement, Props>(
  function Component(props, ref) {
    const View = variants[props.variant] as ComponentType<
      Props & RefAttributes<HTMLButtonElement>
    >;
    return <View {...props} ref={ref} />;
  },
);
