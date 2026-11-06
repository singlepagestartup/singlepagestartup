import type { IProjectAgent } from "../../id/ai-chat/resolver";

export const variant = "agent-avatar-ai-chat";

export interface IAgentAvatarProps {
  variant?: "agent-avatar-ai-chat";
  agent: IProjectAgent;
  onSelect: (agent: IProjectAgent) => void;
}

type IVariantInputs = NonNullable<IAgentAvatarProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "agent-avatar-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
