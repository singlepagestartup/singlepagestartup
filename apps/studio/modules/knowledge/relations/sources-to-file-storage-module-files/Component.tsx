import type { ComponentProps } from "react";
import { Component as Find } from "./singlepage/ai-chat-find/index";
export interface IComponentProps extends ComponentProps<typeof Find> {}
export function Component(props: IComponentProps) {
  return <Find {...props} />;
}
