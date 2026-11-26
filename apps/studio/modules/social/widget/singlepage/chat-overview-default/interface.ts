import type { ReactNode } from "react";
import type { SocialMessageBubbleDefaultProps } from "../../../message/singlepage/bubble-default/interface";
import type { SocialThreadListDefaultProps } from "../../../thread/singlepage/list-default/interface";
import type { SocialPreviewAttachment } from "./utils";

import type { SocialWidgetChatListDefaultProps } from "../chat-list-default/interface";

export const variant = "chat-overview-default";

export interface SocialWidgetChatOverviewDefaultProps {
  variant?: "chat-overview-default";
  chat?: SocialWidgetChatListDefaultProps["chats"][number];
  chatImage?: SocialPreviewAttachment;
  conversation?: {
    thread: SocialThreadListDefaultProps["threads"][number];
    messages: Array<SocialMessageBubbleDefaultProps & { id: string }>;
    onSend: (body: string, attachments: SocialPreviewAttachment[]) => void;
    actions?: ReactNode;
    timelineFooter?: ReactNode;
  };
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
