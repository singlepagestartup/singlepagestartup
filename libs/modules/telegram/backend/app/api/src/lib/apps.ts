import { DefaultApp } from "@sps/shared-backend-api";
import { app as widgetApp } from "@sps/telegram/models/widget/backend/app/api";
import { app as pageApp } from "@sps/telegram/models/page/backend/app/api";

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
  }
}
