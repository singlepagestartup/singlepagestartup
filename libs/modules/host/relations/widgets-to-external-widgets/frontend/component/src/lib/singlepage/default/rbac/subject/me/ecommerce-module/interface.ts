import { IComponentProps as IProductComponentProps } from "./product/interface";
import { IComponentProps as IOrderComponentProps } from "./order/interface";
import { IComponentProps as ICartComponentProps } from "./cart/interface";

export type IComponentProps =
  | IProductComponentProps
  | IOrderComponentProps
  | ICartComponentProps;
