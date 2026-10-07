import type { IAIChatPageProps } from "../ai-chat/Component";
export const variant = "ai-chat-projects-project-id" as const;
export interface IComponentProps extends IAIChatPageProps {
  variant: typeof variant;
}
