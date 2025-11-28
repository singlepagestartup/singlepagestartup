import { app as subjectsToEcommerceModuleProducts } from "@sps/rbac/relations/subjects-to-ecommerce-module-products/backend/app/api";
import { app as subjectsToSocialModuleProfiles } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/app/api";
import { app as widget } from "@sps/rbac/models/widget/backend/app/api";
import { app as role } from "@sps/rbac/models/role/backend/app/api";
import { app as subject } from "@sps/rbac/models/subject/backend/app/api";
import { app as action } from "@sps/rbac/models/action/backend/app/api";
import { app as permission } from "@sps/rbac/models/permission/backend/app/api";
import { app as identity } from "@sps/rbac/models/identity/backend/app/api";
import { app as rolesToPermissions } from "@sps/rbac/relations/roles-to-permissions/backend/app/api";
import { app as subjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/backend/app/api";
import { app as subjectsToRoles } from "@sps/rbac/relations/subjects-to-roles/backend/app/api";
import { app as subjectsToActions } from "@sps/rbac/relations/subjects-to-actions/backend/app/api";
import { app as subjectsToEcommerceModuleOrders } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api";
import { app as subjectsToNotificationModuleTopics } from "@sps/rbac/relations/subjects-to-notification-module-topics/backend/app/api";
import { app as subjectsToBillingModulePaymentIntentsApp } from "@sps/rbac/relations/subjects-to-billing-module-payment-intents/backend/app/api";
import { app as subjectsToBlogModuleArticlesApp } from "@sps/rbac/relations/subjects-to-blog-module-articles/backend/app/api";
import { app as rolesToEcommerceModuleProductsApp } from "@sps/rbac/relations/roles-to-ecommerce-module-products/backend/app/api";
import { DefaultApp } from "@sps/shared-backend-api";

export class Apps {
  apps: { type: "model" | "relation"; route: string; app: DefaultApp<any> }[] =
    [];

  constructor() {
    this.bindApps();
  }

  bindApps() {
    this.apps.push({
      type: "relation",
      route: "/subjects-to-ecommerce-module-products",
      app: subjectsToEcommerceModuleProducts,
    });
    this.apps.push({
      type: "relation",
      route: "/subjects-to-social-module-profiles",
      app: subjectsToSocialModuleProfiles,
    });
    this.apps.push({
      type: "model",
      route: "/widgets",
      app: widget,
    });
    this.apps.push({
      type: "model",
      route: "/roles",
      app: role,
    });
    this.apps.push({
      type: "model",
      route: "/subjects",
      app: subject,
    });
    this.apps.push({
      type: "model",
      route: "/actions",
      app: action,
    });
    this.apps.push({
      type: "model",
      route: "/permissions",
      app: permission,
    });
    this.apps.push({
      type: "model",
      route: "/identities",
      app: identity,
    });
    this.apps.push({
      type: "relation",
      route: "/roles-to-permissions",
      app: rolesToPermissions,
    });
    this.apps.push({
      type: "relation",
      route: "/subjects-to-identities",
      app: subjectsToIdentities,
    });
    this.apps.push({
      type: "relation",
      route: "/subjects-to-roles",
      app: subjectsToRoles,
    });
    this.apps.push({
      type: "relation",
      route: "/subjects-to-actions",
      app: subjectsToActions,
    });
    this.apps.push({
      type: "relation",
      route: "/subjects-to-ecommerce-module-orders",
      app: subjectsToEcommerceModuleOrders,
    });
    this.apps.push({
      type: "relation",
      route: "/subjects-to-notification-module-topics",
      app: subjectsToNotificationModuleTopics,
    });
    this.apps.push({
      type: "relation",
      route: "/subjects-to-billing-module-payment-intents",
      app: subjectsToBillingModulePaymentIntentsApp,
    });
    this.apps.push({
      type: "relation",
      route: "/roles-to-ecommerce-module-products",
      app: rolesToEcommerceModuleProductsApp,
    });
    this.apps.push({
      type: "relation",
      route: "/subjects-to-blog-module-articles",
      app: subjectsToBlogModuleArticlesApp,
    });
  }
}
