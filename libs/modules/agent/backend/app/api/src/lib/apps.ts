import {
  createModuleChildApp,
  defaultAppAssembly,
  type IAppAssembly,
  type IModuleAppEntry,
} from "@sps/shared-backend-api";
import { serviceBootstrap as widgetApp } from "@sps/agent/models/widget/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as agentApp } from "@sps/agent/models/agent/backend/app/api/src/lib/bootstrap";

export class Apps {
  apps: IModuleAppEntry[] = [];

  constructor(private readonly assembly: IAppAssembly = defaultAppAssembly) {
    this.bindApps();
  }

  bindApps() {
    this.apps.push({
      type: "model",
      route: "/widgets",
      app: createModuleChildApp(widgetApp, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/agents",
      app: createModuleChildApp(agentApp, this.assembly),
    });
  }
}
