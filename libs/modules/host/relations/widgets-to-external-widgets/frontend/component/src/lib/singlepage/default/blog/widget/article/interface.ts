import { IComponentProps as IComponentPropsListDefault } from "./list/card-default/interface";
import { IComponentProps as IComponentPropsOverviewDefault } from "./overview/default/interface";

export type IComponentProps =
  | IComponentPropsListDefault
  | IComponentPropsOverviewDefault;
