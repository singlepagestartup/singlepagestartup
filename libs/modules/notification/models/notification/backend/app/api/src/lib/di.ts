import type { Service as BroadcastChannelService } from "@sps/broadcast/models/channel/backend/app/api/src/lib/service";

export interface IBroadcastModule {
  channel: Pick<BroadcastChannelService, "find" | "create" | "queue">;
}

export const NotificationDI = {
  IBroadcastModule: Symbol.for("notification.notification.broadcast.module"),
};
