import { serviceBootstrap as file } from "@sps/file-storage/models/file/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widget } from "@sps/file-storage/models/widget/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widgetsToFiles } from "@sps/file-storage/relations/widgets-to-files/backend/app/api/src/lib/bootstrap";
import {
  createModuleChildApp,
  defaultAppAssembly,
  type IAppAssembly,
  type IModuleAppEntry,
} from "@sps/shared-backend-api";
import { serviceBootstrap as PrivateFileApp } from "@sps/file-storage/models/private-file/backend/app/api/src/lib/bootstrap";

export class Apps {
  apps: IModuleAppEntry[] = [];

  constructor(private readonly assembly: IAppAssembly = defaultAppAssembly) {
    this.bindApps();
  }

  bindApps() {
    this.apps.push({
      type: "model",
      route: "/files",
      app: createModuleChildApp(file, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/widgets",
      app: createModuleChildApp(widget, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-files",
      app: createModuleChildApp(widgetsToFiles, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/private-files",
      app: createModuleChildApp(PrivateFileApp, this.assembly),
    });
  }
}
