import {
  IModel,
  type IProfileAvatar,
} from "@sps/social/models/profile/sdk/model";
import { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "chat-message-row" as const;

export interface IClientComponentProps
  extends Pick<ISpsComponentBase, "className" | "isServer"> {
  language: string;
  data: Pick<IModel, "id" | "title" | "subtitle">;
  profile?: IModel;
  avatar?: IProfileAvatar | null;
  message: ISocialModuleMessage;
  isDeleting?: boolean;
  onProfileOpen?: (profile: IModel) => void;
  onEdit?: (message: ISocialModuleMessage) => void;
  onDelete?: (message: ISocialModuleMessage) => void;
}

export interface IComponentProps
  extends ISpsComponentBase,
    IClientComponentProps {
  variant: typeof variant;
}

export interface IComponentPropsExtended extends IComponentProps {}
