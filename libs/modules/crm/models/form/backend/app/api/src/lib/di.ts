export interface IReadService {
  find: (props?: any) => Promise<any>;
  findById: (props: { id: string }) => Promise<any>;
}

export interface INotificationModule {
  topic: IReadService;
  template: IReadService;
}

export const FormDI = {
  INotificationModule: Symbol.for("crm.form.notification.module"),
};
