import { IComponentProps as IOrderStatusChangedComponentProps } from "./order-status-changed";
import { IComponentProps as IResetPasswordComponentProps } from "./reset-password";
import { IComponentProps as IAgentResultComponentProps } from "./agent-result";

export type IComponentProps =
  | IOrderStatusChangedComponentProps
  | IResetPasswordComponentProps
  | IAgentResultComponentProps;
