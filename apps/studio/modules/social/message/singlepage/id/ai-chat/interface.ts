import type { IProjectMessage } from "../../../../profile/singlepage/scope/ai-chat/project/state";

import type { IProjectAgent } from "../../../../profile/singlepage/agent/id/ai-chat/resolver";

export const variant = "id-ai-chat";

export interface IMessageOverviewProps {
  variant?: "id-ai-chat";
  message: IProjectMessage;
  agent: IProjectAgent | null;
  onSelect: (agent: IProjectAgent) => void;
  showContext: boolean;
}

type IVariantInputs = NonNullable<IMessageOverviewProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "id-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
