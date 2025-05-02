import { app as profile } from "@sps/social/models/profile/backend/app/api";
import { app as widget } from "@sps/social/models/widget/backend/app/api";
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
      route: "/profiles",
      app: profile,
    });
    this.apps.push({
      type: "model",
      route: "/widgets",
      app: widget,
    });
  }
}
