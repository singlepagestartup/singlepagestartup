import { IComponentProps as IGenerateEmailEcommerceOrderStatusChangedDefaultComponentProps } from "./generate-email-ecommerce-order-status-changed-default";
import { IComponentProps as IResetPasswordComponentProps } from "./reset-password";
import { IComponentProps as IGenerateEmailAgentResultAdminComponentProps } from "./generate-email-agent-result-admin";
import { IComponentProps as IGenerateEmailCrmFormRequestCreatedAdmin } from "./generate-email-crm-form-request-created-admin";

export type IComponentProps =
  | IGenerateEmailEcommerceOrderStatusChangedDefaultComponentProps
  | IResetPasswordComponentProps
  | IGenerateEmailAgentResultAdminComponentProps
  | IGenerateEmailCrmFormRequestCreatedAdmin;
