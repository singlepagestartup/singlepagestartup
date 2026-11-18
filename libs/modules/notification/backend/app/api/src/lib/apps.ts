import { serviceBootstrap as notification } from "@sps/notification/models/notification/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widget } from "@sps/notification/models/widget/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as topic } from "@sps/notification/models/topic/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as template } from "@sps/notification/models/template/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as topicsToNotifications } from "@sps/notification/relations/topics-to-notifications/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as notificationsToTemplates } from "@sps/notification/relations/notifications-to-templates/backend/app/api/src/lib/bootstrap";
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
      type: "model",
      route: "/notifications",
      app: createModuleChildApp(notification, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/widgets",
      app: createModuleChildApp(widget, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/topics",
      app: createModuleChildApp(topic, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/topics-to-notifications",
      app: createModuleChildApp(topicsToNotifications, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/templates",
      app: createModuleChildApp(template, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/notifications-to-templates",
      app: createModuleChildApp(notificationsToTemplates, this.assembly),
    });
  }
}
