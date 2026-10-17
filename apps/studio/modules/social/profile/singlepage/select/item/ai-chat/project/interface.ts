import type { IProjectIdentity } from "../../../../scope/ai-chat/project/Profiles";

export const variant = "select-item-ai-chat-project";

export interface IProjectSelectItemProps {
  variant?: "select-item-ai-chat-project";
  data: IProjectIdentity;
  selected: boolean;
  onNavigate?: () => void;
}

type IVariantInputs = NonNullable<IProjectSelectItemProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "select-item-ai-chat-project";
}

export interface IComponentPropsExtended extends IComponentProps {}
