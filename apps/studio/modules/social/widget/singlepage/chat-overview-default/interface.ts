import type { SocialPreviewAttachment } from "./utils";

import type { SocialWidgetChatListDefaultProps } from "../chat-list-default/interface";

export const variant = "chat-overview-default";

export interface SocialWidgetChatOverviewDefaultProps {
  variant?: "chat-overview-default";
  chat?: SocialWidgetChatListDefaultProps["chats"][number];
  chatImage?: SocialPreviewAttachment;
  onChatImageChange?: (file: File | null) => void;
  onChatChange?: (
    chat: SocialWidgetChatListDefaultProps["chats"][number],
  ) => void;
}

type IVariantInputs = NonNullable<SocialWidgetChatOverviewDefaultProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "chat-overview-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
