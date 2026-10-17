import type { IProjectMessage } from "../../../profile/singlepage/scope/ai-chat/project/state";

export const variant = "list-ai-chat";

export interface IMessageListProps {
  variant?: "list-ai-chat";
  threadId: string;
  messages: IProjectMessage[];
  className?: string;
}

type IVariantInputs = NonNullable<IMessageListProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "list-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
