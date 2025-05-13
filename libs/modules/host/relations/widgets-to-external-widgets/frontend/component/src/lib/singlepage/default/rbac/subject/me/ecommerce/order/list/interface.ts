import { IComponentProps as IListDefaultComponentProps } from "./default/interface";
import { IComponentProps as IListTotalDefaultComponentProps } from "./total-default/interface";

export type IComponentProps =
  | IListDefaultComponentProps
  | IListTotalDefaultComponentProps;
