import type { SocialMessageAttachment } from "./Attachments";

export const variant = "bubble-default";

export interface SocialMessageBubbleDefaultProps {
  variant?: "bubble-default";
  author: string;
  role: string;
  body: string;
  time: string;
  side: "incoming" | "outgoing";
  display?: "bubble" | "timeline";
  attachments?: SocialMessageAttachment[];
  onPreviewAttachment?: (attachment: SocialMessageAttachment) => void;
  reactions?: string[];
  reactionOptions?: string[];
}

type IVariantInputs = NonNullable<Partial<SocialMessageBubbleDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "bubble-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
