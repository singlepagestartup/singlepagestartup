import type * as Dialog from "@radix-ui/react-dialog";

import type {
  SocialThreadListDefaultProps,
  SocialPreviewProfile,
} from "../list-default/interface";

import type { SocialPreviewAttachment } from "../../../widget/singlepage/chat-overview-default/utils";

export const variant = "chat-settings";

export interface SocialChatSettingsProps {
  variant?: "chat-settings";
  open: boolean;
  onCloseAutoFocus?: Dialog.DialogContentProps["onCloseAutoFocus"];
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  threads: SocialThreadListDefaultProps["threads"];
  memberIds: string[];
  profiles: SocialPreviewProfile[];
  image?: SocialPreviewAttachment;
  onImageChange?: (file: File | null) => void;
  initialTab?: "general" | "threads" | "members";
  initialThreadId?: string;
  onChatChange?: (title: string, description: string) => void;
  onThreadsChange: (threads: SocialThreadListDefaultProps["threads"]) => void;
  onMembersChange?: (ids: string[]) => void;
}

type IVariantInputs = NonNullable<SocialChatSettingsProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "chat-settings";
}

export interface IComponentPropsExtended extends IComponentProps {}
