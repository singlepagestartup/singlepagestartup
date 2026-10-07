import type { IAIChatPageProps } from "./Component";
export const variant = "ai-chat" as const;
export interface IComponentProps extends IAIChatPageProps {
  variant: typeof variant;
}
