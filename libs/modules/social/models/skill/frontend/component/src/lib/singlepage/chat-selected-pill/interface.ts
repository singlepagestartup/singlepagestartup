export { type IModel } from "@sps/social/models/skill/sdk/model";
import { IModel } from "@sps/social/models/skill/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "chat-selected-pill" as const;

export interface IClientComponentProps
  extends Pick<ISpsComponentBase, "className" | "isServer"> {
  data: IModel;
  language: string;
  onEdit?: (skill: IModel) => void;
  onRemove?: (skill: IModel) => void;
}

export interface IComponentProps
  extends ISpsComponentBase,
    IClientComponentProps {
  variant: typeof variant;
}

export interface IComponentPropsExtended extends IComponentProps {}
