export { type IModel } from "@sps/social/models/skill/sdk/model";
import { IModel } from "@sps/social/models/skill/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "chat-sidebar-item" as const;

export interface IClientComponentProps
  extends Pick<ISpsComponentBase, "className" | "isServer"> {
  data: IModel;
  language: string;
  isSelected?: boolean;
  onSelect?: (skill: IModel) => void;
}

export interface IComponentProps
  extends ISpsComponentBase,
    IClientComponentProps {
  variant: typeof variant;
}

export interface IComponentPropsExtended extends IComponentProps {}
