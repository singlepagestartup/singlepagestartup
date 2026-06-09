import { app as editSuggestion } from "@sps/knowledge/models/edit-suggestion/backend/app/api";
import { app as document } from "@sps/knowledge/models/document/backend/app/api";
import { app as sourcesToChunks } from "@sps/knowledge/relations/sources-to-chunks/backend/app/api";
import { app as sourcesToFileStorageModuleFiles } from "@sps/knowledge/relations/sources-to-file-storage-module-files/backend/app/api";
import { app as chunk } from "@sps/knowledge/models/chunk/backend/app/api";
import { app as source } from "@sps/knowledge/models/source/backend/app/api";
import { DefaultApp } from "@sps/shared-backend-api";

export class Apps {
  apps: { type: "model" | "relation"; route: string; app: DefaultApp<any> }[] =
    [];

  constructor() {
    this.bindApps();
  }

  bindApps() {
    this.apps.push({
      type: "model",
      route: "/edit-suggestions",
      app: editSuggestion,
    });
    this.apps.push({
      type: "model",
      route: "/documents",
      app: document,
    });
    this.apps.push({
      type: "relation",
      route: "/sources-to-chunks",
      app: sourcesToChunks,
    });
    this.apps.push({
      type: "relation",
      route: "/sources-to-file-storage-module-files",
      app: sourcesToFileStorageModuleFiles,
    });
    this.apps.push({
      type: "model",
      route: "/chunks",
      app: chunk,
    });
    this.apps.push({
      type: "model",
      route: "/sources",
      app: source,
    });
  }
}
