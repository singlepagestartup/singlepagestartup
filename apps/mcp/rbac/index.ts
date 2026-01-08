import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerResources as actionRegisterResources,
  registerTools as actionRegisterTools,
} from "./action";
import {
  registerResources as identityRegisterResources,
  registerTools as identityRegisterTools,
} from "./identity";
import {
  registerResources as permissionRegisterResources,
  registerTools as permissionRegisterTools,
} from "./permission";
import {
  registerResources as roleRegisterResources,
  registerTools as roleRegisterTools,
} from "./role";
import {
  registerResources as subjectRegisterResources,
  registerTools as subjectRegisterTools,
} from "./subject";
import {
  registerResources as widgetRegisterResources,
  registerTools as widgetRegisterTools,
} from "./widget";
import {
  registerResources as rolesToEcommerceModuleProductsRegisterResources,
  registerTools as rolesToEcommerceModuleProductsRegisterTools,
} from "./roles-to-ecommerce-module-products";
import {
  registerResources as rolesToPermissionsRegisterResources,
  registerTools as rolesToPermissionsRegisterTools,
} from "./roles-to-permissions";
import {
  registerResources as subjectsToActionsRegisterResources,
  registerTools as subjectsToActionsRegisterTools,
} from "./subjects-to-actions";
import {
  registerResources as subjectsToBillingModulePaymentIntentsRegisterResources,
  registerTools as subjectsToBillingModulePaymentIntentsRegisterTools,
} from "./subjects-to-billing-module-payment-intents";
import {
  registerResources as subjectsToBlogModuleArticlesRegisterResources,
  registerTools as subjectsToBlogModuleArticlesRegisterTools,
} from "./subjects-to-blog-module-articles";
import {
  registerResources as subjectsToEcommerceModuleOrdersRegisterResources,
  registerTools as subjectsToEcommerceModuleOrdersRegisterTools,
} from "./subjects-to-ecommerce-module-orders";
import {
  registerResources as subjectsToEcommerceModuleProductsRegisterResources,
  registerTools as subjectsToEcommerceModuleProductsRegisterTools,
} from "./subjects-to-ecommerce-module-products";
import {
  registerResources as subjectsToIdentitiesRegisterResources,
  registerTools as subjectsToIdentitiesRegisterTools,
} from "./subjects-to-identities";
import {
  registerResources as subjectsToNotificationModuleTopicsRegisterResources,
  registerTools as subjectsToNotificationModuleTopicsRegisterTools,
} from "./subjects-to-notification-module-topics";
import {
  registerResources as subjectsToRolesRegisterResources,
  registerTools as subjectsToRolesRegisterTools,
} from "./subjects-to-roles";
import {
  registerResources as subjectsToSocialModuleProfilesRegisterResources,
  registerTools as subjectsToSocialModuleProfilesRegisterTools,
} from "./subjects-to-social-module-profiles";

export function registerResources(mcp: McpServer) {
  actionRegisterResources(mcp);
  identityRegisterResources(mcp);
  permissionRegisterResources(mcp);
  roleRegisterResources(mcp);
  subjectRegisterResources(mcp);
  widgetRegisterResources(mcp);
  rolesToEcommerceModuleProductsRegisterResources(mcp);
  rolesToPermissionsRegisterResources(mcp);
  subjectsToActionsRegisterResources(mcp);
  subjectsToBillingModulePaymentIntentsRegisterResources(mcp);
  subjectsToBlogModuleArticlesRegisterResources(mcp);
  subjectsToEcommerceModuleOrdersRegisterResources(mcp);
  subjectsToEcommerceModuleProductsRegisterResources(mcp);
  subjectsToIdentitiesRegisterResources(mcp);
  subjectsToNotificationModuleTopicsRegisterResources(mcp);
  subjectsToRolesRegisterResources(mcp);
  subjectsToSocialModuleProfilesRegisterResources(mcp);
}

export function registerTools(mcp: McpServer) {
  actionRegisterTools(mcp);
  identityRegisterTools(mcp);
  permissionRegisterTools(mcp);
  roleRegisterTools(mcp);
  subjectRegisterTools(mcp);
  widgetRegisterTools(mcp);
  rolesToEcommerceModuleProductsRegisterTools(mcp);
  rolesToPermissionsRegisterTools(mcp);
  subjectsToActionsRegisterTools(mcp);
  subjectsToBillingModulePaymentIntentsRegisterTools(mcp);
  subjectsToBlogModuleArticlesRegisterTools(mcp);
  subjectsToEcommerceModuleOrdersRegisterTools(mcp);
  subjectsToEcommerceModuleProductsRegisterTools(mcp);
  subjectsToIdentitiesRegisterTools(mcp);
  subjectsToNotificationModuleTopicsRegisterTools(mcp);
  subjectsToRolesRegisterTools(mcp);
  subjectsToSocialModuleProfilesRegisterTools(mcp);
}
