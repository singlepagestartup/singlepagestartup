import type { IAgentProfileProps } from "./Component";
export const variant = "ai-chat-agent" as const;
export interface IComponentProps extends IAgentProfileProps {
  variant: typeof variant;
}
