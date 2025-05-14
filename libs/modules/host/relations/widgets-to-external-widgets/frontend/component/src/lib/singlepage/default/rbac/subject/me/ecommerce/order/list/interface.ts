import { IComponentProps as IListDefaultComponentProps } from "./default/interface";
import { IComponentProps as IListTotalDefaultComponentProps } from "./total-default/interface";
import { IComponentProps as IListCheckoutDefaultComponentProps } from "./checkout-default/interface";

export type IComponentProps =
  | IListDefaultComponentProps
  | IListTotalDefaultComponentProps
  | IListCheckoutDefaultComponentProps;
