import { serviceBootstrap as subjectsToEcommerceModuleStores } from "@sps/rbac/relations/subjects-to-ecommerce-module-stores/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widgetsToEcommerceModuleWidgets } from "@sps/rbac/relations/widgets-to-ecommerce-module-widgets/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widgetsToCrmModuleWidgets } from "@sps/rbac/relations/widgets-to-crm-module-widgets/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widgetsToWebsiteBuilderModuleWidgets } from "@sps/rbac/relations/widgets-to-website-builder-module-widgets/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as subjectsToEcommerceModuleProducts } from "@sps/rbac/relations/subjects-to-ecommerce-module-products/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as subjectsToSocialModuleProfiles } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widget } from "@sps/rbac/models/widget/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as role } from "@sps/rbac/models/role/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as subject } from "@sps/rbac/models/subject/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as action } from "@sps/rbac/models/action/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as permission } from "@sps/rbac/models/permission/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as identity } from "@sps/rbac/models/identity/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as rolesToPermissions } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as subjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as subjectsToRoles } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as subjectsToActions } from "@sps/rbac/relations/subjects-to-actions/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as subjectsToEcommerceModuleOrders } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as subjectsToNotificationModuleTopics } from "@sps/rbac/relations/subjects-to-notification-module-topics/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as subjectsToBillingModulePaymentIntentsApp } from "@sps/rbac/relations/subjects-to-billing-module-payment-intents/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as subjectsToBlogModuleArticlesApp } from "@sps/rbac/relations/subjects-to-blog-module-articles/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as rolesToEcommerceModuleProductsApp } from "@sps/rbac/relations/roles-to-ecommerce-module-products/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as subjectsToBillingModuleCurrenciesApp } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as permissionsToBillingModuleCurrenciesApp } from "@sps/rbac/relations/permissions-to-billing-module-currencies/backend/app/api/src/lib/bootstrap";
import {
  createModuleChildApp,
  defaultAppAssembly,
  type IAppAssembly,
  type IModuleAppEntry,
} from "@sps/shared-backend-api";

export class Apps {
  apps: IModuleAppEntry[] = [];

  constructor(private readonly assembly: IAppAssembly = defaultAppAssembly) {
    this.bindApps();
  }

  async resolveSubjectId(token: string): Promise<string> {
    return subject
      .createService(this.assembly)
      .isAuthorizedService.getSubjectId(token);
  }

  bindApps() {
    this.apps.push({
      type: "relation",
      route: "/subjects-to-ecommerce-module-stores",
      app: createModuleChildApp(subjectsToEcommerceModuleStores, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-ecommerce-module-widgets",
      app: createModuleChildApp(widgetsToEcommerceModuleWidgets, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-crm-module-widgets",
      app: createModuleChildApp(widgetsToCrmModuleWidgets, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-website-builder-module-widgets",
      app: createModuleChildApp(
        widgetsToWebsiteBuilderModuleWidgets,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/subjects-to-ecommerce-module-products",
      app: createModuleChildApp(
        subjectsToEcommerceModuleProducts,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/subjects-to-social-module-profiles",
      app: createModuleChildApp(subjectsToSocialModuleProfiles, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/widgets",
      app: createModuleChildApp(widget, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/roles",
      app: createModuleChildApp(role, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/subjects",
      app: createModuleChildApp(subject, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/actions",
      app: createModuleChildApp(action, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/permissions",
      app: createModuleChildApp(permission, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/identities",
      app: createModuleChildApp(identity, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/roles-to-permissions",
      app: createModuleChildApp(rolesToPermissions, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/subjects-to-identities",
      app: createModuleChildApp(subjectsToIdentities, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/subjects-to-roles",
      app: createModuleChildApp(subjectsToRoles, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/subjects-to-actions",
      app: createModuleChildApp(subjectsToActions, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/subjects-to-ecommerce-module-orders",
      app: createModuleChildApp(subjectsToEcommerceModuleOrders, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/subjects-to-notification-module-topics",
      app: createModuleChildApp(
        subjectsToNotificationModuleTopics,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/subjects-to-billing-module-payment-intents",
      app: createModuleChildApp(
        subjectsToBillingModulePaymentIntentsApp,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/roles-to-ecommerce-module-products",
      app: createModuleChildApp(
        rolesToEcommerceModuleProductsApp,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/subjects-to-blog-module-articles",
      app: createModuleChildApp(subjectsToBlogModuleArticlesApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/subjects-to-billing-module-currencies",
      app: createModuleChildApp(
        subjectsToBillingModuleCurrenciesApp,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/permissions-to-billing-module-currencies",
      app: createModuleChildApp(
        permissionsToBillingModuleCurrenciesApp,
        this.assembly,
      ),
    });
  }
}
