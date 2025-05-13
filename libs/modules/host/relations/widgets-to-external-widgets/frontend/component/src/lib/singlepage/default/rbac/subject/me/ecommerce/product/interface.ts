import { IComponentProps as ICartDefaultComponentProps } from "./cart-default/interface";
import { IComponentProps as ICheckoutDefaultComponentProps } from "./checkout-default/interface";

export type IComponentProps =
  | ICartDefaultComponentProps
  | ICheckoutDefaultComponentProps;
