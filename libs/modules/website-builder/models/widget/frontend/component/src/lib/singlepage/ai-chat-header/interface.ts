import type { IAccountHeaderProps } from "./Component";
export const variant = "ai-chat-header" as const;
export interface IComponentProps extends IAccountHeaderProps {
  variant: typeof variant;
}
