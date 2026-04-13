export interface IReadService {
  find: (props?: any) => Promise<any>;
  findById: (props: { id: string }) => Promise<any>;
}

export interface ICreateService extends IReadService {
  create: (props: { data: any }) => Promise<any>;
}

export interface IExtendedReadService extends IReadService {
  findByIdExtended: (props: { id: string }) => Promise<any>;
}

export interface IEcommerceOrderReadService extends IExtendedReadService {
  findByIdTotal: (props: { id: string }) => Promise<any>;
  findByIdQuantity: (props: { id: string }) => Promise<any>;
  findByIdCheckoutAttributes: (props: {
    id: string;
    billingModuleCurrencyId?: string;
  }) => Promise<any>;
  findByIdCheckoutAttributesByCurrency: (props: {
    id: string;
    billingModuleCurrencyId?: string;
  }) => Promise<any>;
}

export interface ISocialModule {
  profile: IReadService;
  chat: IReadService;
  thread: IReadService;
  message: IReadService;
  action: IReadService;
  attribute: IReadService;
  attributeKey: IReadService;
  profilesToChats: IReadService;
  profilesToMessages: IReadService;
  profilesToActions: IReadService;
  profilesToAttributes: IReadService;
  chatsToThreads: IReadService;
  chatsToMessages: IReadService;
  chatsToActions: IReadService;
  threadsToMessages: ICreateService;
  messagesToFileStorageModuleFiles: IReadService;
  attributeKeysToAttributes: IReadService;
}

export interface IEcommerceModule {
  store: IReadService;
  order: IEcommerceOrderReadService;
  product: IExtendedReadService;
  attribute: IReadService;
  attributeKey: IReadService;
  storesToOrders: IReadService;
  ordersToProducts: IReadService;
  ordersToBillingModuleCurrencies: IReadService;
  ordersToBillingModulePaymentIntents: IReadService;
  ordersToFileStorageModuleFiles: IReadService;
  productsToAttributes: IReadService;
  productsToFileStorageModuleFiles: IReadService;
  attributesToBillingModuleCurrencies: IReadService;
  attributeKeysToAttributes: IReadService;
}

export interface IBillingModule {
  currency: IReadService;
  paymentIntent: IReadService;
  paymentIntentsToCurrencies: IReadService;
  invoice: IReadService;
  paymentIntentsToInvoices: IReadService;
}

export interface INotificationModule {
  topic: IReadService;
  notification: IReadService;
  template: IReadService;
  topicsToNotifications: IReadService;
  notificationsToTemplates: IReadService;
}

export interface IFileStorageModule {
  file: IReadService;
}

export interface ICrmModule {
  form: IReadService;
  request: IReadService;
  formsToRequests: IReadService;
}

export interface IBroadcastModule {
  channel: IReadService;
}

export const SubjectDI = {
  ISocialModule: Symbol.for("rbac.subject.social.module"),
  IEcommerceModule: Symbol.for("rbac.subject.ecommerce.module"),
  IBillingModule: Symbol.for("rbac.subject.billing.module"),
  INotificationModule: Symbol.for("rbac.subject.notification.module"),
  IFileStorageModule: Symbol.for("rbac.subject.file-storage.module"),
  ICrmModule: Symbol.for("rbac.subject.crm.module"),
  IBroadcastModule: Symbol.for("rbac.subject.broadcast.module"),
  IIdentityService: Symbol.for("rbac.subject.identity.service"),
  IRoleService: Symbol.for("rbac.subject.role.service"),
  IRolesToEcommerceModuleProductsService: Symbol.for(
    "rbac.subject.roles-to-ecommerce-module-products.service",
  ),
  ISubjectsToRolesService: Symbol.for("rbac.subject.subjects-to-roles.service"),
  ISubjectsToIdentitiesService: Symbol.for(
    "rbac.subject.subjects-to-identities.service",
  ),
  ISubjectsToSocialModuleProfilesService: Symbol.for(
    "rbac.subject.subjects-to-social-module-profiles.service",
  ),
  ISubjectsToEcommerceModuleOrdersService: Symbol.for(
    "rbac.subject.subjects-to-ecommerce-module-orders.service",
  ),
  ISubjectsToBillingModuleCurrenciesService: Symbol.for(
    "rbac.subject.subjects-to-billing-module-currencies.service",
  ),
  IIsAuthorizedService: Symbol.for("rbac.subject.is-authorized.service"),
  IBillRouteService: Symbol.for("rbac.subject.bill-route.service"),
  IEcommerceOrderProceedService: Symbol.for(
    "rbac.subject.ecommerce-order-proceed.service",
  ),
};
