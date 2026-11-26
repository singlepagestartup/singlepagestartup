import {
  IModel,
  type IProfileAvatar,
} from "@sps/social/models/profile/sdk/model";
import type {
  IChatMessage as ISocialModuleChatMessage,
  IModel as ISocialModuleMessage,
} from "@sps/social/models/message/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";
import type { ReactNode } from "react";

export const variant = "chat-message-row" as const;

export interface IClientComponentProps extends Pick<
  ISpsComponentBase,
  "className" | "isServer"
> {
  language: string;
  data: Pick<IModel, "id" | "title" | "subtitle">;
  profile?: IModel;
  avatar?: IProfileAvatar | null;
  message: ISocialModuleChatMessage;
  attachmentsSlot?: ReactNode;
  messageContentSlot?: ReactNode;
  interactionSlot?: ReactNode;
  isDeleting?: boolean;
  isOwnMessage?: boolean;
  onProfileOpen?: (
    profile: IModel,
    trigger: HTMLButtonElement,
    avatar?: IProfileAvatar | null,
    displayName?: string,
  ) => void;
  onEdit?: (message: ISocialModuleMessage) => void;
  onDelete?: (message: ISocialModuleMessage) => void;
}

export interface IComponentProps
  extends ISpsComponentBase, IClientComponentProps {
  variant: typeof variant;
}

export interface IComponentPropsExtended extends IComponentProps {}
