import { DefaultApp } from "@sps/shared-backend-api";
import { app as widgetApp } from "@sps/analytic/models/widget/backend/app/api";
import { app as metricApp } from "@sps/analytic/models/metric/backend/app/api";

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
      route: "/metrics",
      app: metricApp,
    });
  }
}
