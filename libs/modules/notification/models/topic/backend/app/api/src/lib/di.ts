import type { Service as NotificationService } from "@sps/notification/models/notification/backend/app/api/src/lib/service";

export interface IReadService {
  find: (props?: any) => Promise<any>;
  findById: (props: { id: string }) => Promise<any>;
}

export interface INotificationModule {
  notification: Pick<
    NotificationService,
    | "find"
    | "findById"
    | "sendPending"
    | "createDelivery"
    | "updateDelivery"
    | "provider"
  >;
}

export const TopicDI = {
  INotificationModule: Symbol.for("notification.topic.notification.module"),
};
