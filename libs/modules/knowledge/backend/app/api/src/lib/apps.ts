import { serviceBootstrap as sourcesToChunks } from "@sps/knowledge/relations/sources-to-chunks/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as sourcesToFileStorageModuleFiles } from "@sps/knowledge/relations/sources-to-file-storage-module-files/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as chunk } from "@sps/knowledge/models/chunk/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as source } from "@sps/knowledge/models/source/backend/app/api/src/lib/bootstrap";
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

  bindApps() {
    this.apps.push({
      type: "relation",
      route: "/sources-to-chunks",
      app: createModuleChildApp(sourcesToChunks, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/sources-to-file-storage-module-files",
      app: createModuleChildApp(sourcesToFileStorageModuleFiles, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/chunks",
      app: createModuleChildApp(chunk, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/sources",
      app: createModuleChildApp(source, this.assembly),
    });
  }
}
