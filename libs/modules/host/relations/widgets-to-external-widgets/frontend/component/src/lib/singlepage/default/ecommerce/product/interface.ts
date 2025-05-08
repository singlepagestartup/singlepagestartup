import { IComponentProps as ICategoryRowButtonDefaultComponentProps } from "./category-row-button-default/interface";
import { IComponentProps as IOverviewDefaultComponentProps } from "./overview-default/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";

export type IComponentProps =
  | ICategoryRowButtonDefaultComponentProps
  | IOverviewDefaultComponentProps
  | IDefaultComponentProps;
