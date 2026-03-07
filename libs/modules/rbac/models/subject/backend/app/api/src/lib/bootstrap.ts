import { Container, ContainerModule, interfaces } from "inversify";
import {
  CRUDService,
  DI,
  ExceptionFilter,
  type IExceptionFilter,
} from "@sps/shared-backend-api";
import { Configuration } from "./configuration";
import { Repository } from "./repository";
import { Controller } from "./controller";
import { Service } from "./service";
import { App } from "./app";
import {
  SubjectDI,
  type IBillingModule,
  type IBroadcastModule,
  type ICrmModule,
  type IEcommerceModule,
  type IFileStorageModule,
  type INotificationModule,
  type ISocialModule,
} from "./di";
import { Service as SubjectsToRolesService } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/service";
import { Repository as SubjectsToRolesRepository } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/repository";
import { Configuration as SubjectsToRolesConfiguration } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/configuration";
import { Service as IsAuthorizedService } from "./service/singlepage/is-authorized";
import { Service as SubjectsToBillingModuleCurrenciesService } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Repository as SubjectsToBillingModuleCurrenciesRepository } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/app/api/src/lib/repository";
import { Configuration as SubjectsToBillingModuleCurrenciesConfiguration } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/app/api/src/lib/configuration";
import { Service as BillRouteService } from "./service/singlepage/bill-route";
import { Service as EcommerceOrderProceedService } from "./service/singlepage/ecommerce/order/proceed";
import { Service as IdentityService } from "@sps/rbac/models/identity/backend/app/api/src/lib/service";
import { Repository as IdentityRepository } from "@sps/rbac/models/identity/backend/app/api/src/lib/repository";
import { Configuration as IdentityConfiguration } from "@sps/rbac/models/identity/backend/app/api/src/lib/configuration";
import { Service as RoleService } from "@sps/rbac/models/role/backend/app/api/src/lib/service";
import { Repository as RoleRepository } from "@sps/rbac/models/role/backend/app/api/src/lib/repository";
import { Configuration as RoleConfiguration } from "@sps/rbac/models/role/backend/app/api/src/lib/configuration";
import { Service as RolesToEcommerceModuleProductsService } from "@sps/rbac/relations/roles-to-ecommerce-module-products/backend/app/api/src/lib/service";
import { Repository as RolesToEcommerceModuleProductsRepository } from "@sps/rbac/relations/roles-to-ecommerce-module-products/backend/app/api/src/lib/repository";
import { Configuration as RolesToEcommerceModuleProductsConfiguration } from "@sps/rbac/relations/roles-to-ecommerce-module-products/backend/app/api/src/lib/configuration";
import { Service as SubjectsToIdentitiesService } from "@sps/rbac/relations/subjects-to-identities/backend/app/api/src/lib/service";
import { Repository as SubjectsToIdentitiesRepository } from "@sps/rbac/relations/subjects-to-identities/backend/app/api/src/lib/repository";
import { Configuration as SubjectsToIdentitiesConfiguration } from "@sps/rbac/relations/subjects-to-identities/backend/app/api/src/lib/configuration";
import { Service as SubjectsToSocialModuleProfilesService } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/app/api/src/lib/service";
import { Repository as SubjectsToSocialModuleProfilesRepository } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/app/api/src/lib/repository";
import { Configuration as SubjectsToSocialModuleProfilesConfiguration } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/app/api/src/lib/configuration";
import { Service as SubjectsToEcommerceModuleOrdersService } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/service";
import { Repository as SubjectsToEcommerceModuleOrdersRepository } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/repository";
import { Configuration as SubjectsToEcommerceModuleOrdersConfiguration } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/configuration";
import { Repository as SocialProfileRepository } from "@sps/social/models/profile/backend/app/api/src/lib/repository";
import { Configuration as SocialProfileConfiguration } from "@sps/social/models/profile/backend/app/api/src/lib/configuration";
import { Repository as SocialChatRepository } from "@sps/social/models/chat/backend/app/api/src/lib/repository";
import { Configuration as SocialChatConfiguration } from "@sps/social/models/chat/backend/app/api/src/lib/configuration";
import { Repository as SocialMessageRepository } from "@sps/social/models/message/backend/app/api/src/lib/repository";
import { Configuration as SocialMessageConfiguration } from "@sps/social/models/message/backend/app/api/src/lib/configuration";
import { Repository as SocialActionRepository } from "@sps/social/models/action/backend/app/api/src/lib/repository";
import { Configuration as SocialActionConfiguration } from "@sps/social/models/action/backend/app/api/src/lib/configuration";
import { Repository as SocialAttributeRepository } from "@sps/social/models/attribute/backend/app/api/src/lib/repository";
import { Configuration as SocialAttributeConfiguration } from "@sps/social/models/attribute/backend/app/api/src/lib/configuration";
import { Repository as SocialAttributeKeyRepository } from "@sps/social/models/attribute-key/backend/app/api/src/lib/repository";
import { Configuration as SocialAttributeKeyConfiguration } from "@sps/social/models/attribute-key/backend/app/api/src/lib/configuration";
import { Repository as SocialProfilesToChatsRepository } from "@sps/social/relations/profiles-to-chats/backend/app/api/src/lib/repository";
import { Configuration as SocialProfilesToChatsConfiguration } from "@sps/social/relations/profiles-to-chats/backend/app/api/src/lib/configuration";
import { Repository as SocialProfilesToMessagesRepository } from "@sps/social/relations/profiles-to-messages/backend/app/api/src/lib/repository";
import { Configuration as SocialProfilesToMessagesConfiguration } from "@sps/social/relations/profiles-to-messages/backend/app/api/src/lib/configuration";
import { Repository as SocialProfilesToActionsRepository } from "@sps/social/relations/profiles-to-actions/backend/app/api/src/lib/repository";
import { Configuration as SocialProfilesToActionsConfiguration } from "@sps/social/relations/profiles-to-actions/backend/app/api/src/lib/configuration";
import { Repository as SocialProfilesToAttributesRepository } from "@sps/social/relations/profiles-to-attributes/backend/app/api/src/lib/repository";
import { Configuration as SocialProfilesToAttributesConfiguration } from "@sps/social/relations/profiles-to-attributes/backend/app/api/src/lib/configuration";
import { Repository as SocialChatsToMessagesRepository } from "@sps/social/relations/chats-to-messages/backend/app/api/src/lib/repository";
import { Configuration as SocialChatsToMessagesConfiguration } from "@sps/social/relations/chats-to-messages/backend/app/api/src/lib/configuration";
import { Repository as SocialChatsToActionsRepository } from "@sps/social/relations/chats-to-actions/backend/app/api/src/lib/repository";
import { Configuration as SocialChatsToActionsConfiguration } from "@sps/social/relations/chats-to-actions/backend/app/api/src/lib/configuration";
import { Repository as SocialMessagesToFileStorageModuleFilesRepository } from "@sps/social/relations/messages-to-file-storage-module-files/backend/app/api/src/lib/repository";
import { Configuration as SocialMessagesToFileStorageModuleFilesConfiguration } from "@sps/social/relations/messages-to-file-storage-module-files/backend/app/api/src/lib/configuration";
import { Repository as SocialAttributeKeysToAttributesRepository } from "@sps/social/relations/attribute-keys-to-attributes/backend/app/api/src/lib/repository";
import { Configuration as SocialAttributeKeysToAttributesConfiguration } from "@sps/social/relations/attribute-keys-to-attributes/backend/app/api/src/lib/configuration";
import { Repository as EcommerceStoreRepository } from "@sps/ecommerce/models/store/backend/app/api/src/lib/repository";
import { Configuration as EcommerceStoreConfiguration } from "@sps/ecommerce/models/store/backend/app/api/src/lib/configuration";
import { Repository as EcommerceOrderRepository } from "@sps/ecommerce/models/order/backend/app/api/src/lib/repository";
import { Configuration as EcommerceOrderConfiguration } from "@sps/ecommerce/models/order/backend/app/api/src/lib/configuration";
import { Service as EcommerceOrderService } from "@sps/ecommerce/models/order/backend/app/api/src/lib/service";
import { Service as EcommerceOrderCheckoutAttributesService } from "@sps/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/checkout-attributes";
import { Service as EcommerceOrderGetTotalService } from "@sps/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/get-total";
import { Service as EcommerceOrderGetQuantityService } from "@sps/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/get-quantity";
import { Service as EcommerceProductService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/service";
import { Repository as EcommerceProductRepository } from "@sps/ecommerce/models/product/backend/app/api/src/lib/repository";
import { Configuration as EcommerceProductConfiguration } from "@sps/ecommerce/models/product/backend/app/api/src/lib/configuration";
import { Repository as EcommerceAttributeRepository } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/repository";
import { Configuration as EcommerceAttributeConfiguration } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/configuration";
import { Repository as EcommerceAttributeKeyRepository } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/repository";
import { Configuration as EcommerceAttributeKeyConfiguration } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/configuration";
import { Repository as EcommerceStoresToOrdersRepository } from "@sps/ecommerce/relations/stores-to-orders/backend/app/api/src/lib/repository";
import { Configuration as EcommerceStoresToOrdersConfiguration } from "@sps/ecommerce/relations/stores-to-orders/backend/app/api/src/lib/configuration";
import { Repository as EcommerceOrdersToProductsRepository } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/repository";
import { Configuration as EcommerceOrdersToProductsConfiguration } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/configuration";
import { Repository as EcommerceOrdersToBillingModuleCurrenciesRepository } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/backend/app/api/src/lib/repository";
import { Configuration as EcommerceOrdersToBillingModuleCurrenciesConfiguration } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/backend/app/api/src/lib/configuration";
import { Repository as EcommerceOrdersToBillingModulePaymentIntentsRepository } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/repository";
import { Configuration as EcommerceOrdersToBillingModulePaymentIntentsConfiguration } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/configuration";
import { Repository as EcommerceOrdersToFileStorageModuleFilesRepository } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/backend/app/api/src/lib/repository";
import { Configuration as EcommerceOrdersToFileStorageModuleFilesConfiguration } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/backend/app/api/src/lib/configuration";
import { Repository as EcommerceProductsToAttributesRepository } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/repository";
import { Configuration as EcommerceProductsToAttributesConfiguration } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/configuration";
import { Repository as EcommerceProductsToFileStorageModuleFilesRepository } from "@sps/ecommerce/relations/products-to-file-storage-module-files/backend/app/api/src/lib/repository";
import { Configuration as EcommerceProductsToFileStorageModuleFilesConfiguration } from "@sps/ecommerce/relations/products-to-file-storage-module-files/backend/app/api/src/lib/configuration";
import { Repository as EcommerceAttributesToBillingModuleCurrenciesRepository } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/repository";
import { Configuration as EcommerceAttributesToBillingModuleCurrenciesConfiguration } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/configuration";
import { Repository as EcommerceAttributeKeysToAttributesRepository } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/repository";
import { Configuration as EcommerceAttributeKeysToAttributesConfiguration } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/configuration";
import { Repository as BillingCurrencyRepository } from "@sps/billing/models/currency/backend/app/api/src/lib/repository";
import { Configuration as BillingCurrencyConfiguration } from "@sps/billing/models/currency/backend/app/api/src/lib/configuration";
import { Repository as BillingPaymentIntentRepository } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/repository";
import { Configuration as BillingPaymentIntentConfiguration } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/configuration";
import { Repository as BillingInvoiceRepository } from "@sps/billing/models/invoice/backend/app/api/src/lib/repository";
import { Configuration as BillingInvoiceConfiguration } from "@sps/billing/models/invoice/backend/app/api/src/lib/configuration";
import { Repository as BillingPaymentIntentsToCurrenciesRepository } from "@sps/billing/relations/payment-intents-to-currencies/backend/app/api/src/lib/repository";
import { Configuration as BillingPaymentIntentsToCurrenciesConfiguration } from "@sps/billing/relations/payment-intents-to-currencies/backend/app/api/src/lib/configuration";
import { Repository as BillingPaymentIntentsToInvoicesRepository } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/repository";
import { Configuration as BillingPaymentIntentsToInvoicesConfiguration } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/configuration";
import { Repository as NotificationTopicRepository } from "@sps/notification/models/topic/backend/app/api/src/lib/repository";
import { Configuration as NotificationTopicConfiguration } from "@sps/notification/models/topic/backend/app/api/src/lib/configuration";
import { Repository as NotificationNotificationRepository } from "@sps/notification/models/notification/backend/app/api/src/lib/repository";
import { Configuration as NotificationNotificationConfiguration } from "@sps/notification/models/notification/backend/app/api/src/lib/configuration";
import { Repository as NotificationTemplateRepository } from "@sps/notification/models/template/backend/app/api/src/lib/repository";
import { Configuration as NotificationTemplateConfiguration } from "@sps/notification/models/template/backend/app/api/src/lib/configuration";
import { Repository as NotificationTopicsToNotificationsRepository } from "@sps/notification/relations/topics-to-notifications/backend/app/api/src/lib/repository";
import { Configuration as NotificationTopicsToNotificationsConfiguration } from "@sps/notification/relations/topics-to-notifications/backend/app/api/src/lib/configuration";
import { Repository as NotificationNotificationsToTemplatesRepository } from "@sps/notification/relations/notifications-to-templates/backend/app/api/src/lib/repository";
import { Configuration as NotificationNotificationsToTemplatesConfiguration } from "@sps/notification/relations/notifications-to-templates/backend/app/api/src/lib/configuration";
import { Repository as FileStorageFileRepository } from "@sps/file-storage/models/file/backend/app/api/src/lib/repository";
import { Configuration as FileStorageFileConfiguration } from "@sps/file-storage/models/file/backend/app/api/src/lib/configuration";
import { Repository as CrmFormRepository } from "@sps/crm/models/form/backend/app/api/src/lib/repository";
import { Configuration as CrmFormConfiguration } from "@sps/crm/models/form/backend/app/api/src/lib/configuration";
import { Repository as CrmRequestRepository } from "@sps/crm/models/request/backend/app/api/src/lib/repository";
import { Configuration as CrmRequestConfiguration } from "@sps/crm/models/request/backend/app/api/src/lib/configuration";
import { Repository as CrmFormsToRequestsRepository } from "@sps/crm/relations/forms-to-requests/backend/app/api/src/lib/repository";
import { Configuration as CrmFormsToRequestsConfiguration } from "@sps/crm/relations/forms-to-requests/backend/app/api/src/lib/configuration";
import { Repository as BroadcastChannelRepository } from "@sps/broadcast/models/channel/backend/app/api/src/lib/repository";
import { Configuration as BroadcastChannelConfiguration } from "@sps/broadcast/models/channel/backend/app/api/src/lib/configuration";

const bindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<ISocialModule>(SubjectDI.ISocialModule)
    .toDynamicValue(() => {
      return {
        profile: new CRUDService<any>(
          new SocialProfileRepository(new SocialProfileConfiguration()),
        ),
        chat: new CRUDService<any>(
          new SocialChatRepository(new SocialChatConfiguration()),
        ),
        message: new CRUDService<any>(
          new SocialMessageRepository(new SocialMessageConfiguration()),
        ),
        action: new CRUDService<any>(
          new SocialActionRepository(new SocialActionConfiguration()),
        ),
        attribute: new CRUDService<any>(
          new SocialAttributeRepository(new SocialAttributeConfiguration()),
        ),
        attributeKey: new CRUDService<any>(
          new SocialAttributeKeyRepository(
            new SocialAttributeKeyConfiguration(),
          ),
        ),
        profilesToChats: new CRUDService<any>(
          new SocialProfilesToChatsRepository(
            new SocialProfilesToChatsConfiguration(),
          ),
        ),
        profilesToMessages: new CRUDService<any>(
          new SocialProfilesToMessagesRepository(
            new SocialProfilesToMessagesConfiguration(),
          ),
        ),
        profilesToActions: new CRUDService<any>(
          new SocialProfilesToActionsRepository(
            new SocialProfilesToActionsConfiguration(),
          ),
        ),
        profilesToAttributes: new CRUDService<any>(
          new SocialProfilesToAttributesRepository(
            new SocialProfilesToAttributesConfiguration(),
          ),
        ),
        chatsToMessages: new CRUDService<any>(
          new SocialChatsToMessagesRepository(
            new SocialChatsToMessagesConfiguration(),
          ),
        ),
        chatsToActions: new CRUDService<any>(
          new SocialChatsToActionsRepository(
            new SocialChatsToActionsConfiguration(),
          ),
        ),
        messagesToFileStorageModuleFiles: new CRUDService<any>(
          new SocialMessagesToFileStorageModuleFilesRepository(
            new SocialMessagesToFileStorageModuleFilesConfiguration(),
          ),
        ),
        attributeKeysToAttributes: new CRUDService<any>(
          new SocialAttributeKeysToAttributesRepository(
            new SocialAttributeKeysToAttributesConfiguration(),
          ),
        ),
      };
    })
    .inSingletonScope();
  bind<IEcommerceModule>(SubjectDI.IEcommerceModule)
    .toDynamicValue(() => {
      const store = new CRUDService<any>(
        new EcommerceStoreRepository(new EcommerceStoreConfiguration()),
      );
      const attribute = new CRUDService<any>(
        new EcommerceAttributeRepository(new EcommerceAttributeConfiguration()),
      );
      const attributeKey = new CRUDService<any>(
        new EcommerceAttributeKeyRepository(
          new EcommerceAttributeKeyConfiguration(),
        ),
      );
      const storesToOrders = new CRUDService<any>(
        new EcommerceStoresToOrdersRepository(
          new EcommerceStoresToOrdersConfiguration(),
        ),
      );
      const ordersToProducts = new CRUDService<any>(
        new EcommerceOrdersToProductsRepository(
          new EcommerceOrdersToProductsConfiguration(),
        ),
      );
      const ordersToBillingModuleCurrencies = new CRUDService<any>(
        new EcommerceOrdersToBillingModuleCurrenciesRepository(
          new EcommerceOrdersToBillingModuleCurrenciesConfiguration(),
        ),
      );
      const ordersToBillingModulePaymentIntents = new CRUDService<any>(
        new EcommerceOrdersToBillingModulePaymentIntentsRepository(
          new EcommerceOrdersToBillingModulePaymentIntentsConfiguration(),
        ),
      );
      const ordersToFileStorageModuleFiles = new CRUDService<any>(
        new EcommerceOrdersToFileStorageModuleFilesRepository(
          new EcommerceOrdersToFileStorageModuleFilesConfiguration(),
        ),
      );
      const productsToAttributes = new CRUDService<any>(
        new EcommerceProductsToAttributesRepository(
          new EcommerceProductsToAttributesConfiguration(),
        ),
      );
      const productsToFileStorageModuleFiles = new CRUDService<any>(
        new EcommerceProductsToFileStorageModuleFilesRepository(
          new EcommerceProductsToFileStorageModuleFilesConfiguration(),
        ),
      );
      const attributesToBillingModuleCurrencies = new CRUDService<any>(
        new EcommerceAttributesToBillingModuleCurrenciesRepository(
          new EcommerceAttributesToBillingModuleCurrenciesConfiguration(),
        ),
      );
      const attributeKeysToAttributes = new CRUDService<any>(
        new EcommerceAttributeKeysToAttributesRepository(
          new EcommerceAttributeKeysToAttributesConfiguration(),
        ),
      );
      const product = new EcommerceProductService(
        new EcommerceProductRepository(new EcommerceProductConfiguration()),
        productsToAttributes as any,
        attribute as any,
        attributeKeysToAttributes as any,
        attributeKey as any,
        attributesToBillingModuleCurrencies as any,
        productsToFileStorageModuleFiles as any,
      );

      const checkoutAttributesService =
        new EcommerceOrderCheckoutAttributesService(
          attributeKey as any,
          ordersToProducts as any,
          product as any,
          productsToAttributes as any,
          attributeKeysToAttributes as any,
          attribute as any,
          attributesToBillingModuleCurrencies as any,
        );
      const getTotalService = new EcommerceOrderGetTotalService(
        attributeKey as any,
        ordersToProducts as any,
      );
      const getQuantityService = new EcommerceOrderGetQuantityService(
        ordersToProducts as any,
      );
      const order = new EcommerceOrderService(
        new EcommerceOrderRepository(new EcommerceOrderConfiguration()),
        checkoutAttributesService,
        getTotalService,
        getQuantityService,
        product as any,
        attribute as any,
        attributeKey as any,
        ordersToProducts as any,
        productsToAttributes as any,
        attributeKeysToAttributes as any,
        attributesToBillingModuleCurrencies as any,
        ordersToBillingModuleCurrencies as any,
        ordersToFileStorageModuleFiles as any,
        productsToFileStorageModuleFiles as any,
        ordersToBillingModulePaymentIntents as any,
      );

      return {
        store,
        order,
        product,
        attribute,
        attributeKey,
        storesToOrders,
        ordersToProducts,
        ordersToBillingModuleCurrencies,
        ordersToBillingModulePaymentIntents,
        ordersToFileStorageModuleFiles,
        productsToAttributes,
        productsToFileStorageModuleFiles,
        attributesToBillingModuleCurrencies,
        attributeKeysToAttributes,
      };
    })
    .inSingletonScope();
  bind<IBillingModule>(SubjectDI.IBillingModule)
    .toDynamicValue(() => {
      return {
        currency: new CRUDService<any>(
          new BillingCurrencyRepository(new BillingCurrencyConfiguration()),
        ),
        paymentIntent: new CRUDService<any>(
          new BillingPaymentIntentRepository(
            new BillingPaymentIntentConfiguration(),
          ),
        ),
        paymentIntentsToCurrencies: new CRUDService<any>(
          new BillingPaymentIntentsToCurrenciesRepository(
            new BillingPaymentIntentsToCurrenciesConfiguration(),
          ),
        ),
        invoice: new CRUDService<any>(
          new BillingInvoiceRepository(new BillingInvoiceConfiguration()),
        ),
        paymentIntentsToInvoices: new CRUDService<any>(
          new BillingPaymentIntentsToInvoicesRepository(
            new BillingPaymentIntentsToInvoicesConfiguration(),
          ),
        ),
      };
    })
    .inSingletonScope();
  bind<INotificationModule>(SubjectDI.INotificationModule)
    .toDynamicValue(() => {
      return {
        topic: new CRUDService<any>(
          new NotificationTopicRepository(new NotificationTopicConfiguration()),
        ),
        notification: new CRUDService<any>(
          new NotificationNotificationRepository(
            new NotificationNotificationConfiguration(),
          ),
        ),
        template: new CRUDService<any>(
          new NotificationTemplateRepository(
            new NotificationTemplateConfiguration(),
          ),
        ),
        topicsToNotifications: new CRUDService<any>(
          new NotificationTopicsToNotificationsRepository(
            new NotificationTopicsToNotificationsConfiguration(),
          ),
        ),
        notificationsToTemplates: new CRUDService<any>(
          new NotificationNotificationsToTemplatesRepository(
            new NotificationNotificationsToTemplatesConfiguration(),
          ),
        ),
      };
    })
    .inSingletonScope();
  bind<IFileStorageModule>(SubjectDI.IFileStorageModule)
    .toDynamicValue(() => {
      return {
        file: new CRUDService<any>(
          new FileStorageFileRepository(new FileStorageFileConfiguration()),
        ),
      };
    })
    .inSingletonScope();
  bind<ICrmModule>(SubjectDI.ICrmModule)
    .toDynamicValue(() => {
      return {
        form: new CRUDService<any>(
          new CrmFormRepository(new CrmFormConfiguration()),
        ),
        request: new CRUDService<any>(
          new CrmRequestRepository(new CrmRequestConfiguration()),
        ),
        formsToRequests: new CRUDService<any>(
          new CrmFormsToRequestsRepository(
            new CrmFormsToRequestsConfiguration(),
          ),
        ),
      };
    })
    .inSingletonScope();
  bind<IBroadcastModule>(SubjectDI.IBroadcastModule)
    .toDynamicValue(() => {
      return {
        channel: new CRUDService<any>(
          new BroadcastChannelRepository(new BroadcastChannelConfiguration()),
        ),
      };
    })
    .inSingletonScope();
  bind<IdentityService>(SubjectDI.IIdentityService)
    .toDynamicValue(
      () =>
        new IdentityService(
          new IdentityRepository(new IdentityConfiguration()),
        ),
    )
    .inSingletonScope();
  bind<RoleService>(SubjectDI.IRoleService)
    .toDynamicValue(
      () => new RoleService(new RoleRepository(new RoleConfiguration())),
    )
    .inSingletonScope();
  bind<RolesToEcommerceModuleProductsService>(
    SubjectDI.IRolesToEcommerceModuleProductsService,
  )
    .toDynamicValue(
      () =>
        new RolesToEcommerceModuleProductsService(
          new RolesToEcommerceModuleProductsRepository(
            new RolesToEcommerceModuleProductsConfiguration(),
          ),
        ),
    )
    .inSingletonScope();
  bind<SubjectsToRolesService>(SubjectDI.ISubjectsToRolesService)
    .toDynamicValue(
      () =>
        new SubjectsToRolesService(
          new SubjectsToRolesRepository(new SubjectsToRolesConfiguration()),
        ),
    )
    .inSingletonScope();
  bind<SubjectsToIdentitiesService>(SubjectDI.ISubjectsToIdentitiesService)
    .toDynamicValue(
      () =>
        new SubjectsToIdentitiesService(
          new SubjectsToIdentitiesRepository(
            new SubjectsToIdentitiesConfiguration(),
          ),
        ),
    )
    .inSingletonScope();
  bind<SubjectsToSocialModuleProfilesService>(
    SubjectDI.ISubjectsToSocialModuleProfilesService,
  )
    .toDynamicValue(
      () =>
        new SubjectsToSocialModuleProfilesService(
          new SubjectsToSocialModuleProfilesRepository(
            new SubjectsToSocialModuleProfilesConfiguration(),
          ),
        ),
    )
    .inSingletonScope();
  bind<SubjectsToEcommerceModuleOrdersService>(
    SubjectDI.ISubjectsToEcommerceModuleOrdersService,
  )
    .toDynamicValue(
      () =>
        new SubjectsToEcommerceModuleOrdersService(
          new SubjectsToEcommerceModuleOrdersRepository(
            new SubjectsToEcommerceModuleOrdersConfiguration(),
          ),
        ),
    )
    .inSingletonScope();
  bind<SubjectsToBillingModuleCurrenciesService>(
    SubjectDI.ISubjectsToBillingModuleCurrenciesService,
  )
    .toDynamicValue(
      () =>
        new SubjectsToBillingModuleCurrenciesService(
          new SubjectsToBillingModuleCurrenciesRepository(
            new SubjectsToBillingModuleCurrenciesConfiguration(),
          ),
        ),
    )
    .inSingletonScope();
  bind<IsAuthorizedService>(SubjectDI.IIsAuthorizedService)
    .to(IsAuthorizedService)
    .inSingletonScope();
  bind<BillRouteService>(SubjectDI.IBillRouteService)
    .to(BillRouteService)
    .inSingletonScope();
  bind<EcommerceOrderProceedService>(SubjectDI.IEcommerceOrderProceedService)
    .to(EcommerceOrderProceedService)
    .inSingletonScope();
});

export async function bootstrap() {
  const container = new Container({
    skipBaseClassChecks: true,
  });
  container.load(bindings);
  const app = container.get<App>(DI.IApp);
  await app.init();

  return { app };
}
