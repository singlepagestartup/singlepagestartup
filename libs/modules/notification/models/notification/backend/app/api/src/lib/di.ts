import type { Service as BroadcastMessageService } from "@sps/broadcast/models/message/backend/app/api/src/lib/service";
import type { Service as BroadcastChannelService } from "@sps/broadcast/models/channel/backend/app/api/src/lib/service";

export interface IBroadcastModule {
  channel: Pick<BroadcastChannelService, "find" | "create">;
  message: Pick<BroadcastMessageService, "queue">;
}

export const NotificationDI = {
  IBroadcastModule: Symbol.for("notification.notification.broadcast.module"),
};
