import { app as formsToSteps } from "@sps/crm/relations/forms-to-steps/backend/app/api";
import { app as stepsToInputs } from "@sps/crm/relations/steps-to-inputs/backend/app/api";
import { app as step } from "@sps/crm/models/step/backend/app/api";
import { app as optionsToFileStorageModuleFiles } from "@sps/crm/relations/options-to-file-storage-module-files/backend/app/api";
import { app as inputsToOptions } from "@sps/crm/relations/inputs-to-options/backend/app/api";
import { app as option } from "@sps/crm/models/option/backend/app/api";
import { DefaultApp } from "@sps/shared-backend-api";
import { app as widgetApp } from "@sps/crm/models/widget/backend/app/api";
import { app as formApp } from "@sps/crm/models/form/backend/app/api";
import { app as inputApp } from "@sps/crm/models/input/backend/app/api";
import { app as requestApp } from "@sps/crm/models/request/backend/app/api";
import { app as widgetsToFormsApp } from "@sps/crm/relations/widgets-to-forms/backend/app/api";
import { app as formsToRequestsApp } from "@sps/crm/relations/forms-to-requests/backend/app/api";
import { app as widgetsToWebsiteBuilderModuleWidgets } from "@sps/crm/relations/widgets-to-website-builder-module-widgets/backend/app/api";

export class Apps {
  apps: { type: "model" | "relation"; route: string; app: DefaultApp<any> }[] =
    [];

  constructor() {
    this.bindApps();
  }

  bindApps() {
    this.apps.push({
      type: "relation",
      route: "/forms-to-steps",
      app: formsToSteps,
    });
    this.apps.push({
      type: "relation",
      route: "/steps-to-inputs",
      app: stepsToInputs,
    });
    this.apps.push({
      type: "model",
      route: "/steps",
      app: step,
    });
    this.apps.push({
      type: "relation",
      route: "/options-to-file-storage-module-files",
      app: optionsToFileStorageModuleFiles,
    });
    this.apps.push({
      type: "relation",
      route: "/inputs-to-options",
      app: inputsToOptions,
    });
    this.apps.push({
      type: "model",
      route: "/options",
      app: option,
    });
    this.apps.push({
      type: "model",
      route: "/widgets",
      app: widgetApp,
    });
    this.apps.push({
      type: "model",
      route: "/forms",
      app: formApp,
    });
    this.apps.push({
      type: "model",
      route: "/inputs",
      app: inputApp,
    });
    this.apps.push({
      type: "model",
      route: "/requests",
      app: requestApp,
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-forms",
      app: widgetsToFormsApp,
    });
    this.apps.push({
      type: "relation",
      route: "/forms-to-requests",
      app: formsToRequestsApp,
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-website-builder-module-widgets",
      app: widgetsToWebsiteBuilderModuleWidgets,
    });
  }
}
