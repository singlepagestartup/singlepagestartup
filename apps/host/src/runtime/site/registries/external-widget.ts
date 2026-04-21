import { analyticAdapter } from "../adapters/external/analytic";
import { billingAdapter } from "../adapters/external/billing";
import { blogAdapter } from "../adapters/external/blog";
import { crmAdapter } from "../adapters/external/crm";
import { ecommerceAdapter } from "../adapters/external/ecommerce";
import { fileStorageAdapter } from "../adapters/external/file-storage";
import { notificationAdapter } from "../adapters/external/notification";
import { rbacAdapter } from "../adapters/external/rbac";
import { socialAdapter } from "../adapters/external/social";
import { startupAdapter } from "../adapters/external/startup";
import { websiteBuilderAdapter } from "../adapters/external/website-builder";
import { ExternalWidgetAdapter } from "../types";

export const externalWidgetRegistry: Record<string, ExternalWidgetAdapter> = {
  analytic: analyticAdapter,
  billing: billingAdapter,
  blog: blogAdapter,
  crm: crmAdapter,
  ecommerce: ecommerceAdapter,
  "file-storage": fileStorageAdapter,
  notification: notificationAdapter,
  rbac: rbacAdapter,
  social: socialAdapter,
  startup: startupAdapter,
  "website-builder": websiteBuilderAdapter,
};
