import type { ReactNode } from "react";
export const variant = "content-social-chat-default" as const;
export interface IComponentProps {
  variant?: typeof variant;
  className?: string;
  children?: ReactNode;
}
export interface IComponentPropsExtended extends IComponentProps {}
