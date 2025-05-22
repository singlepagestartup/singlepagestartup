import { app as profilesToFileStorageModuleFiles } from "@sps/social/relations/profiles-to-file-storage-module-files/backend/app/api";
import { app as profilesToWebsiteBuilderModuleWidgets } from "@sps/social/relations/profiles-to-website-builder-module-widgets/backend/app/api";
import { app as profile } from "@sps/social/models/profile/backend/app/api";
import { app as widget } from "@sps/social/models/widget/backend/app/api";
import { app as attribute } from "@sps/social/models/attribute/backend/app/api";
import { app as attributeKey } from "@sps/social/models/attribute-key/backend/app/api";
import { app as profilesToAttributes } from "@sps/social/relations/profiles-to-attributes/backend/app/api";
import { app as attributeKeysToAttributes } from "@sps/social/relations/attribute-keys-to-attributes/backend/app/api";
import { DefaultApp } from "@sps/shared-backend-api";

export class Apps {
  apps: { type: "model" | "relation"; route: string; app: DefaultApp<any> }[] =
    [];

  constructor() {
    this.bindApps();
  }

  bindApps() {
    this.apps.push({
      type: "relation",
      route: "/profiles-to-file-storage-module-files",
      app: profilesToFileStorageModuleFiles,
    });
    this.apps.push({
      type: "relation",
      route: "/profiles-to-website-builder-module-widgets",
      app: profilesToWebsiteBuilderModuleWidgets,
    });
    this.apps.push({
      type: "model",
      route: "/profiles",
      app: profile,
    });
    this.apps.push({
      type: "model",
      route: "/widgets",
      app: widget,
    });
    this.apps.push({
      type: "model",
      route: "/attributes",
      app: attribute,
    });
    this.apps.push({
      type: "model",
      route: "/attribute-keys",
      app: attributeKey,
    });
    this.apps.push({
      type: "relation",
      route: "/profiles-to-attributes",
      app: profilesToAttributes,
    });
    this.apps.push({
      type: "relation",
      route: "/attribute-keys-to-attributes",
      app: attributeKeysToAttributes,
    });
  }
}
