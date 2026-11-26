import { serviceBootstrap as FunnelsToEcommerceModuleStoresToProductsApp } from "@sps/crm/relations/funnels-to-ecommerce-module-stores-to-products/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as FunnelsToTasksApp } from "@sps/crm/relations/funnels-to-tasks/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as FunnelsToStagesApp } from "@sps/crm/relations/funnels-to-stages/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as TasksToStagesApp } from "@sps/crm/relations/tasks-to-stages/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as StageApp } from "@sps/crm/models/stage/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as formsToSteps } from "@sps/crm/relations/forms-to-steps/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as stepsToInputs } from "@sps/crm/relations/steps-to-inputs/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as step } from "@sps/crm/models/step/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as optionsToFileStorageModuleFiles } from "@sps/crm/relations/options-to-file-storage-module-files/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as inputsToOptions } from "@sps/crm/relations/inputs-to-options/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as option } from "@sps/crm/models/option/backend/app/api/src/lib/bootstrap";
import {
  createModuleChildApp,
  defaultAppAssembly,
  type IAppAssembly,
  type IModuleAppEntry,
} from "@sps/shared-backend-api";
import { serviceBootstrap as widgetApp } from "@sps/crm/models/widget/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as formApp } from "@sps/crm/models/form/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as inputApp } from "@sps/crm/models/input/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as requestApp } from "@sps/crm/models/request/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widgetsToFormsApp } from "@sps/crm/relations/widgets-to-forms/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as formsToRequestsApp } from "@sps/crm/relations/forms-to-requests/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widgetsToWebsiteBuilderModuleWidgets } from "@sps/crm/relations/widgets-to-website-builder-module-widgets/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as FunnelApp } from "@sps/crm/models/funnel/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as TaskApp } from "@sps/crm/models/task/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as TasksToEcommerceModuleStoresToProductsApp } from "@sps/crm/relations/tasks-to-ecommerce-module-stores-to-products/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as TasksToEcommerceModuleOrdersApp } from "@sps/crm/relations/tasks-to-ecommerce-module-orders/backend/app/api/src/lib/bootstrap";

export class Apps {
  apps: IModuleAppEntry[] = [];

  constructor(private readonly assembly: IAppAssembly = defaultAppAssembly) {
    this.bindApps();
  }

  bindApps() {
    this.apps.push({
      type: "relation",
      route: "/funnels-to-ecommerce-module-stores-to-products",
      app: createModuleChildApp(
        FunnelsToEcommerceModuleStoresToProductsApp,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/funnels-to-tasks",
      app: createModuleChildApp(FunnelsToTasksApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/funnels-to-stages",
      app: createModuleChildApp(FunnelsToStagesApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/tasks-to-stages",
      app: createModuleChildApp(TasksToStagesApp, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/stages",
      app: createModuleChildApp(StageApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/forms-to-steps",
      app: createModuleChildApp(formsToSteps, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/steps-to-inputs",
      app: createModuleChildApp(stepsToInputs, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/steps",
      app: createModuleChildApp(step, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/options-to-file-storage-module-files",
      app: createModuleChildApp(optionsToFileStorageModuleFiles, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/inputs-to-options",
      app: createModuleChildApp(inputsToOptions, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/options",
      app: createModuleChildApp(option, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/widgets",
      app: createModuleChildApp(widgetApp, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/forms",
      app: createModuleChildApp(formApp, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/inputs",
      app: createModuleChildApp(inputApp, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/requests",
      app: createModuleChildApp(requestApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-forms",
      app: createModuleChildApp(widgetsToFormsApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/forms-to-requests",
      app: createModuleChildApp(formsToRequestsApp, this.assembly),
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
      type: "model",
      route: "/funnels",
      app: createModuleChildApp(FunnelApp, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/tasks",
      app: createModuleChildApp(TaskApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/tasks-to-ecommerce-module-stores-to-products",
      app: createModuleChildApp(
        TasksToEcommerceModuleStoresToProductsApp,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/tasks-to-ecommerce-module-orders",
      app: createModuleChildApp(TasksToEcommerceModuleOrdersApp, this.assembly),
    });
  }
}
