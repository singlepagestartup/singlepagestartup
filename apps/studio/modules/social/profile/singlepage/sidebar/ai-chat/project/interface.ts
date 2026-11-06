export const variant = "sidebar-ai-chat-project";

export interface IProfileSidebarProps {
  variant?: "sidebar-ai-chat-project";
  profileId: string;
  chatId?: string;
  selected: "products" | "settings" | "thread-create";
}

type IVariantInputs = NonNullable<IProfileSidebarProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "sidebar-ai-chat-project";
}

export interface IComponentPropsExtended extends IComponentProps {}
