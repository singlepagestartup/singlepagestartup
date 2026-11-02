import type { ReactNode } from "react";
export const variant = "content-ai-chat-forgot-password" as const;
export interface IComponentProps {
  variant?: typeof variant;
  children?: ReactNode;
}
export interface IComponentPropsExtended extends IComponentProps {}
