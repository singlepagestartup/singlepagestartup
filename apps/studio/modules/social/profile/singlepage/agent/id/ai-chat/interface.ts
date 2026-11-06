import type { ReactNode } from "react";

import type { IProjectAgent } from "./resolver";

export const variant = "agent-id-ai-chat";

export interface IAgentProfileProps {
  variant?: "agent-id-ai-chat";
  knowledge?: ReactNode;
  knowledgeCount?: number;
  skills?: ReactNode;
  skillsCount?: number;
  agent: IProjectAgent | null;
  onClose: () => void;
}

export interface IAgentPickerProps {
  agent: IProjectAgent | null;
  agents: IProjectAgent[];
  onChange: (agent: IProjectAgent | null) => void;
  onSave: (agent: IProjectAgent) => void;
}

type IVariantInputs = NonNullable<IAgentProfileProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "agent-id-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
