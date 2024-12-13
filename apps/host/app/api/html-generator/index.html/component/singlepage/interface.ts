import { IComponentProps as IOrderStatusChangedComponentProps } from "./order-status-changed";
import { IComponentProps as IResetPasswordComponentProps } from "./reset-password";

export type IComponentProps =
  | IOrderStatusChangedComponentProps
  | IResetPasswordComponentProps;
