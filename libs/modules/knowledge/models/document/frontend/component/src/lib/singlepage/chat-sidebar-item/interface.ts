export { type IModel } from "@sps/knowledge/models/document/sdk/model";
import { IModel } from "@sps/knowledge/models/document/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "chat-sidebar-item" as const;

export interface IClientComponentProps
  extends Pick<ISpsComponentBase, "className" | "isServer"> {
  data: IModel;
  language: string;
  isSelected?: boolean;
  needsReindex?: boolean;
  onSelect?: (document: IModel) => void;
}

export interface IComponentProps
  extends ISpsComponentBase,
    IClientComponentProps {
  variant: typeof variant;
}

export interface IComponentPropsExtended extends IComponentProps {}
