import { IComponentProps as IChatListDefaultComponentProps } from "./chat/list/default/interface";
import { IComponentProps as IChatOverviewDefaultComponentProps } from "./chat/overview/default/interface";
import { IComponentProps as IProfileOverviewDefaultComponentProps } from "./profile/overview/default/interface";

export type IComponentProps =
  | IChatListDefaultComponentProps
  | IProfileOverviewDefaultComponentProps
  | IChatOverviewDefaultComponentProps;
