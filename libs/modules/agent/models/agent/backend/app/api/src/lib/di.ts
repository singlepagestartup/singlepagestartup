export interface IReadService {
  find: (props?: any) => Promise<any>;
  findById: (props: { id: string }) => Promise<any>;
}

export interface ISocialModule {
  profile: IReadService;
  chat: IReadService;
  message: IReadService;
  action: IReadService;
  profilesToChats: IReadService;
  profilesToMessages: IReadService;
  profilesToActions: IReadService;
  chatsToMessages: IReadService;
  chatsToActions: IReadService;
}

export interface IRbacModule {
  subject: IReadService;
  role: IReadService;
  subjectsToIdentities: IReadService;
  subjectsToSocialModuleProfiles: IReadService;
  subjectsToRoles: IReadService;
  rolesToEcommerceModuleProducts: IReadService;
}

export interface IEcommerceModule {
  order: IReadService;
  product: IReadService;
  attribute: IReadService;
  attributeKey: IReadService;
  productsToAttributes: IReadService;
  productsToFileStorageModuleFiles: IReadService;
  attributeKeysToAttributes: IReadService;
  attributesToBillingModuleCurrencies: IReadService;
}

export interface IBillingModule {
  currency: IReadService;
  paymentIntent: IReadService;
  invoice: IReadService;
}

export interface INotificationModule {
  notification: IReadService;
}

export interface IFileStorageModule {
  file: IReadService;
}

export interface IBroadcastModule {
  channel: IReadService;
  message: IReadService;
}

export const AgentDI = {
  ISocialModule: Symbol.for("agent.social.module"),
  IRbacModule: Symbol.for("agent.rbac.module"),
  IEcommerceModule: Symbol.for("agent.ecommerce.module"),
  IBillingModule: Symbol.for("agent.billing.module"),
  INotificationModule: Symbol.for("agent.notification.module"),
  IFileStorageModule: Symbol.for("agent.file-storage.module"),
  IBroadcastModule: Symbol.for("agent.broadcast.module"),
};
