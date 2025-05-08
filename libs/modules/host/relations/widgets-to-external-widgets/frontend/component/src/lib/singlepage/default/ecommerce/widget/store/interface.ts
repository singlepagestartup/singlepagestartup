import { IComponentProps as IListComponentProps } from "./list/interface";
import { IComponentProps as IOverviewDefaultComponentProps } from "./overview/default/interface";

export type IComponentProps =
  | IListComponentProps
  | IOverviewDefaultComponentProps;
