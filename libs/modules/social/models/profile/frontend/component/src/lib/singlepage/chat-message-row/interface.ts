import { IModel } from "@sps/social/models/profile/sdk/model";
import { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "chat-message-row" as const;

export interface IClientComponentProps
  extends Pick<ISpsComponentBase, "className" | "isServer"> {
  language: string;
  data: IModel;
  message: ISocialModuleMessage;
  isDeleting?: boolean;
  onEdit?: (message: ISocialModuleMessage) => void;
  onDelete?: (message: ISocialModuleMessage) => void;
}

export interface IComponentProps
  extends ISpsComponentBase,
    IClientComponentProps {
  variant: typeof variant;
}

export interface IComponentPropsExtended extends IComponentProps {}
