import { IComponentProps as ICartDefaultComponentProps } from "./cart-default/interface";
import { IComponentProps as IOverviewDefaultComponentProps } from "./overview-default/interface";
import { IComponentProps as ICategoryRowButtonDefaultComponentProps } from "./category-row-button-default/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as ISocialModuleProfileButtonDefaultComponentProps } from "./social-module-profile-button-default/interface";

export type IComponentProps =
  | ICartDefaultComponentProps
  | IOverviewDefaultComponentProps
  | ICategoryRowButtonDefaultComponentProps
  | IDefaultComponentProps
  | ISocialModuleProfileButtonDefaultComponentProps;
