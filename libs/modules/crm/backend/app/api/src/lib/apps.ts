import { DefaultApp } from "@sps/shared-backend-api";
import { app as widgetApp } from "@sps/crm/models/widget/backend/app/api";
import { app as formApp } from "@sps/crm/models/form/backend/app/api";
import { app as inputApp } from "@sps/crm/models/input/backend/app/api";
import { app as widgetsToFormsApp } from "@sps/crm/relations/widgets-to-forms/backend/app/api";
import { app as formsToInputsApp } from "@sps/crm/relations/forms-to-inputs/backend/app/api";

export class Apps {
  apps: { type: "model" | "relation"; route: string; app: DefaultApp<any> }[] =
    [];

  constructor() {
    this.bindApps();
  }

  bindApps() {
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
      type: "relation",
      route: "/widgets-to-forms",
      app: widgetsToFormsApp,
    });
    this.apps.push({
      type: "relation",
      route: "/forms-to-inputs",
      app: formsToInputsApp,
    });
  }
}
