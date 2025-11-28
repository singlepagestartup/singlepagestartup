import { DefaultApp } from "@sps/shared-backend-api";
import { app as widgetApp } from "@sps/telegram/models/widget/backend/app/api";
import { app as pageApp } from "@sps/telegram/models/page/backend/app/api";
import { app as pagesToWidgets } from "@sps/telegram/relations/pages-to-widgets/backend/app/api";
import { app as widgetsToExternalWidgets } from "@sps/telegram/relations/widgets-to-external-widgets/backend/app/api";

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
      route: "/pages",
      app: pageApp,
    });
    this.apps.push({
      type: "relation",
      route: "/pages-to-widgets",
      app: pagesToWidgets,
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-external-widgets",
      app: widgetsToExternalWidgets,
    });
  }
}
