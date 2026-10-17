import type { IAIChatThread } from "../id/ai-chat/state";

export const variant = "list-item-sidebar-ai-chat";

export interface IThreadListItemProps {
  variant?: "list-item-sidebar-ai-chat";
  data?: IAIChatThread;
  id: string;
  name: string;
  topic?: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
}

type IVariantInputs = NonNullable<IThreadListItemProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "list-item-sidebar-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
