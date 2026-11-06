import type { IAIChatChat } from "../../../profile/singlepage/scope/ai-chat/project/models";

export const variant = "list-item-ai-chat";

export interface IChatListItemProps {
  variant?: "list-item-ai-chat";
  data: IAIChatChat;
  selected: boolean;
  onSelect: (id: string) => void;
}

type IVariantInputs = NonNullable<IChatListItemProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "list-item-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
