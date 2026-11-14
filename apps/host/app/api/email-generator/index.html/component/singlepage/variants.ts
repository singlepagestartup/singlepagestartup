import { Component as ContentEmail } from "./content-email";
import { Component as GenerateEmailEcommerceOrderStatusChangedDefault } from "./generate-email-ecommerce-order-status-changed-default";
import { Component as ResetPassword } from "./reset-password";
import { Component as GenerateEmailAgentResultAdmin } from "./generate-email-agent-result-admin";
import { Component as GenerateEmailCrmFormRequestCreatedAdmin } from "./generate-email-crm-form-request-created-admin";

export const variants = {
  "content-email": ContentEmail,
  "generate-email-ecommerce-order-status-changed-default":
    GenerateEmailEcommerceOrderStatusChangedDefault,
  "reset-password": ResetPassword,
  "generate-email-agent-result-admin": GenerateEmailAgentResultAdmin,
  "generate-email-crm-form-request-created-admin":
    GenerateEmailCrmFormRequestCreatedAdmin,
};
