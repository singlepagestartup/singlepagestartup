import type { ComponentProps } from "react";
import type { Component } from "./index";
export const variant = "ai-chat-tokens" as const;
export interface IComponentProps
  extends NonNullable<ComponentProps<typeof Component>> {
  variant: typeof variant;
}
