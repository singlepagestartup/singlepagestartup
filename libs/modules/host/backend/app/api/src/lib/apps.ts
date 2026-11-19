import { serviceBootstrap as metadataToFileStorageModuleFiles } from "@sps/host/relations/metadata-to-file-storage-module-files/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as layout } from "@sps/host/models/layout/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as metadata } from "@sps/host/models/metadata/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as page } from "@sps/host/models/page/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widget } from "@sps/host/models/widget/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as layoutsToWidgets } from "@sps/host/relations/layouts-to-widgets/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as pagesToLayouts } from "@sps/host/relations/pages-to-layouts/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as pagesToMetadata } from "@sps/host/relations/pages-to-metadata/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as pagesToWidgets } from "@sps/host/relations/pages-to-widgets/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widgetsToExternalModules } from "@sps/host/relations/widgets-to-external-widgets/backend/app/api/src/lib/bootstrap";
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
      route: "/metadata-to-file-storage-module-files",
      app: createModuleChildApp(
        metadataToFileStorageModuleFiles,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "model",
      route: "/layouts",
      app: createModuleChildApp(layout, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/metadata",
      app: createModuleChildApp(metadata, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/pages",
      app: createModuleChildApp(page, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/widgets",
      app: createModuleChildApp(widget, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/layouts-to-widgets",
      app: createModuleChildApp(layoutsToWidgets, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/pages-to-layouts",
      app: createModuleChildApp(pagesToLayouts, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/pages-to-metadata",
      app: createModuleChildApp(pagesToMetadata, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/pages-to-widgets",
      app: createModuleChildApp(pagesToWidgets, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-external-widgets",
      app: createModuleChildApp(widgetsToExternalModules, this.assembly),
    });
  }
}
