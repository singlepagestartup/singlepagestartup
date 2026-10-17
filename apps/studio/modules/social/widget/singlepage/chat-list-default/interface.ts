import type { SocialPreviewAttachment } from "../chat-overview-default/utils";

export const variant = "chat-list-default";

export interface SocialWidgetChatListDefaultProps {
  variant?: "chat-list-default";
  selectedId?: string;
  chatImages?: Record<string, SocialPreviewAttachment>;
  onSelectChat?: (id: string) => void;
  onCreateChat?: (
    chat: SocialWidgetChatListDefaultProps["chats"][number],
    imageFile?: File | null,
  ) => void;
  chats: Array<{
    id: string;
    name: string;
    description: string;
    unread: number;
    active?: boolean;
    memberIds?: string[];
    icon: "general" | "engineering" | "design" | "marketing" | "random";
  }>;
}

type IVariantInputs = NonNullable<Partial<SocialWidgetChatListDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "chat-list-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
