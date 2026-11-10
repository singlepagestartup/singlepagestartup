import type { Service as BroadcastChannelService } from "@sps/broadcast/models/channel/backend/app/api/src/lib/service";

import type { Service as TemplateService } from "@sps/notification/models/template/backend/app/api/src/lib/service";

export type ITemplateService = Pick<TemplateService, "find" | "render">;

export interface IBroadcastModule {
  channel: Pick<BroadcastChannelService, "find" | "create" | "queue">;
}

export const NotificationDI = {
  ITemplateService: Symbol.for("notification.notification.template.service"),
  IBroadcastModule: Symbol.for("notification.notification.broadcast.module"),
};
