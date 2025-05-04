import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as ISocialModuleProfileOverviewDefaultComponentProps } from "./social-module-profile-overview-default/interface";

export type IComponentProps =
  | IDefaultComponentProps
  | ISocialModuleProfileOverviewDefaultComponentProps;
