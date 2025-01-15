import { DefaultApp } from "@sps/shared-backend-api";
import { app as widgetApp } from "@sps/agent/models/widget/backend/app/api";
import { app as agentApp } from "@sps/agent/models/agent/backend/app/api";

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
      route: "/agents",
      app: agentApp,
    });
  }
}
