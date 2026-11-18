import { serviceBootstrap as channel } from "@sps/broadcast/models/channel/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as message } from "@sps/broadcast/models/message/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as channelsToMessages } from "@sps/broadcast/relations/channels-to-messages/backend/app/api/src/lib/bootstrap";

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
      route: "/channels",
      app: createModuleChildApp(channel, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/messages",
      app: createModuleChildApp(message, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/channels-to-messages",
      app: createModuleChildApp(channelsToMessages, this.assembly),
    });
  }
}
