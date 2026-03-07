export interface IReadService {
  find: (props?: any) => Promise<any>;
  findById: (props: { id: string }) => Promise<any>;
}

export interface INotificationModule {
  notification: IReadService;
  topicsToNotifications: IReadService;
}

export const TopicDI = {
  INotificationModule: Symbol.for("notification.topic.notification.module"),
};
