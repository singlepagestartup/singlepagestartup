import { IComponentProps as IOrderStatusChangedComponentProps } from "./order-status-changed";
import { IComponentProps as IResetPasswordComponentProps } from "./reset-password";
import { IComponentProps as IAgentResultComponentProps } from "./agent-result";
import { IComponentProps as IRequestFromWebsiteComponentProps } from "./request-from-website";

export type IComponentProps =
  | IOrderStatusChangedComponentProps
  | IResetPasswordComponentProps
  | IAgentResultComponentProps
  | IRequestFromWebsiteComponentProps;
