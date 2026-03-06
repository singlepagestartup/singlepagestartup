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
  AgentDI,
  type IBillingModule,
  type IBroadcastModule,
  type IEcommerceModule,
  type IFileStorageModule,
  type INotificationModule,
  type IRbacModule,
  type ISocialModule,
} from "./di";
import { Repository as SocialProfileRepository } from "@sps/social/models/profile/backend/app/api/src/lib/repository";
import { Configuration as SocialProfileConfiguration } from "@sps/social/models/profile/backend/app/api/src/lib/configuration";
import { Repository as SocialChatRepository } from "@sps/social/models/chat/backend/app/api/src/lib/repository";
import { Configuration as SocialChatConfiguration } from "@sps/social/models/chat/backend/app/api/src/lib/configuration";
import { Repository as SocialMessageRepository } from "@sps/social/models/message/backend/app/api/src/lib/repository";
import { Configuration as SocialMessageConfiguration } from "@sps/social/models/message/backend/app/api/src/lib/configuration";
import { Repository as SocialActionRepository } from "@sps/social/models/action/backend/app/api/src/lib/repository";
import { Configuration as SocialActionConfiguration } from "@sps/social/models/action/backend/app/api/src/lib/configuration";
import { Repository as SocialProfilesToChatsRepository } from "@sps/social/relations/profiles-to-chats/backend/app/api/src/lib/repository";
import { Configuration as SocialProfilesToChatsConfiguration } from "@sps/social/relations/profiles-to-chats/backend/app/api/src/lib/configuration";
import { Repository as SocialProfilesToMessagesRepository } from "@sps/social/relations/profiles-to-messages/backend/app/api/src/lib/repository";
import { Configuration as SocialProfilesToMessagesConfiguration } from "@sps/social/relations/profiles-to-messages/backend/app/api/src/lib/configuration";
import { Repository as SocialProfilesToActionsRepository } from "@sps/social/relations/profiles-to-actions/backend/app/api/src/lib/repository";
import { Configuration as SocialProfilesToActionsConfiguration } from "@sps/social/relations/profiles-to-actions/backend/app/api/src/lib/configuration";
import { Repository as SocialChatsToMessagesRepository } from "@sps/social/relations/chats-to-messages/backend/app/api/src/lib/repository";
import { Configuration as SocialChatsToMessagesConfiguration } from "@sps/social/relations/chats-to-messages/backend/app/api/src/lib/configuration";
import { Repository as SocialChatsToActionsRepository } from "@sps/social/relations/chats-to-actions/backend/app/api/src/lib/repository";
import { Configuration as SocialChatsToActionsConfiguration } from "@sps/social/relations/chats-to-actions/backend/app/api/src/lib/configuration";
import { Repository as RbacSubjectRepository } from "@sps/rbac/models/subject/backend/app/api/src/lib/repository";
import { Configuration as RbacSubjectConfiguration } from "@sps/rbac/models/subject/backend/app/api/src/lib/configuration";
import { Repository as RbacRoleRepository } from "@sps/rbac/models/role/backend/app/api/src/lib/repository";
import { Configuration as RbacRoleConfiguration } from "@sps/rbac/models/role/backend/app/api/src/lib/configuration";
import { Repository as RbacSubjectsToIdentitiesRepository } from "@sps/rbac/relations/subjects-to-identities/backend/app/api/src/lib/repository";
import { Configuration as RbacSubjectsToIdentitiesConfiguration } from "@sps/rbac/relations/subjects-to-identities/backend/app/api/src/lib/configuration";
import { Repository as RbacSubjectsToSocialModuleProfilesRepository } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/app/api/src/lib/repository";
import { Configuration as RbacSubjectsToSocialModuleProfilesConfiguration } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/app/api/src/lib/configuration";
import { Repository as RbacSubjectsToRolesRepository } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/repository";
import { Configuration as RbacSubjectsToRolesConfiguration } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/configuration";
import { Repository as RbacRolesToEcommerceModuleProductsRepository } from "@sps/rbac/relations/roles-to-ecommerce-module-products/backend/app/api/src/lib/repository";
import { Configuration as RbacRolesToEcommerceModuleProductsConfiguration } from "@sps/rbac/relations/roles-to-ecommerce-module-products/backend/app/api/src/lib/configuration";
import { Repository as EcommerceOrderRepository } from "@sps/ecommerce/models/order/backend/app/api/src/lib/repository";
import { Configuration as EcommerceOrderConfiguration } from "@sps/ecommerce/models/order/backend/app/api/src/lib/configuration";
import { Repository as EcommerceProductRepository } from "@sps/ecommerce/models/product/backend/app/api/src/lib/repository";
import { Configuration as EcommerceProductConfiguration } from "@sps/ecommerce/models/product/backend/app/api/src/lib/configuration";
import { Repository as EcommerceAttributeRepository } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/repository";
import { Configuration as EcommerceAttributeConfiguration } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/configuration";
import { Repository as EcommerceAttributeKeyRepository } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/repository";
import { Configuration as EcommerceAttributeKeyConfiguration } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/configuration";
import { Repository as EcommerceProductsToAttributesRepository } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/repository";
import { Configuration as EcommerceProductsToAttributesConfiguration } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/configuration";
import { Repository as EcommerceProductsToFileStorageModuleFilesRepository } from "@sps/ecommerce/relations/products-to-file-storage-module-files/backend/app/api/src/lib/repository";
import { Configuration as EcommerceProductsToFileStorageModuleFilesConfiguration } from "@sps/ecommerce/relations/products-to-file-storage-module-files/backend/app/api/src/lib/configuration";
import { Repository as EcommerceAttributeKeysToAttributesRepository } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/repository";
import { Configuration as EcommerceAttributeKeysToAttributesConfiguration } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/configuration";
import { Repository as EcommerceAttributesToBillingModuleCurrenciesRepository } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/repository";
import { Configuration as EcommerceAttributesToBillingModuleCurrenciesConfiguration } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/configuration";
import { Repository as BillingCurrencyRepository } from "@sps/billing/models/currency/backend/app/api/src/lib/repository";
import { Configuration as BillingCurrencyConfiguration } from "@sps/billing/models/currency/backend/app/api/src/lib/configuration";
import { Repository as BillingPaymentIntentRepository } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/repository";
import { Configuration as BillingPaymentIntentConfiguration } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/configuration";
import { Repository as BillingInvoiceRepository } from "@sps/billing/models/invoice/backend/app/api/src/lib/repository";
import { Configuration as BillingInvoiceConfiguration } from "@sps/billing/models/invoice/backend/app/api/src/lib/configuration";
import { Repository as NotificationNotificationRepository } from "@sps/notification/models/notification/backend/app/api/src/lib/repository";
import { Configuration as NotificationNotificationConfiguration } from "@sps/notification/models/notification/backend/app/api/src/lib/configuration";
import { Repository as FileStorageFileRepository } from "@sps/file-storage/models/file/backend/app/api/src/lib/repository";
import { Configuration as FileStorageFileConfiguration } from "@sps/file-storage/models/file/backend/app/api/src/lib/configuration";
import { Repository as BroadcastChannelRepository } from "@sps/broadcast/models/channel/backend/app/api/src/lib/repository";
import { Configuration as BroadcastChannelConfiguration } from "@sps/broadcast/models/channel/backend/app/api/src/lib/configuration";
import { Repository as BroadcastMessageRepository } from "@sps/broadcast/models/message/backend/app/api/src/lib/repository";
import { Configuration as BroadcastMessageConfiguration } from "@sps/broadcast/models/message/backend/app/api/src/lib/configuration";

const bindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<ISocialModule>(AgentDI.ISocialModule)
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
      };
    })
    .inSingletonScope();
  bind<IRbacModule>(AgentDI.IRbacModule)
    .toDynamicValue(() => {
      return {
        subject: new CRUDService<any>(
          new RbacSubjectRepository(new RbacSubjectConfiguration()),
        ),
        role: new CRUDService<any>(
          new RbacRoleRepository(new RbacRoleConfiguration()),
        ),
        subjectsToIdentities: new CRUDService<any>(
          new RbacSubjectsToIdentitiesRepository(
            new RbacSubjectsToIdentitiesConfiguration(),
          ),
        ),
        subjectsToSocialModuleProfiles: new CRUDService<any>(
          new RbacSubjectsToSocialModuleProfilesRepository(
            new RbacSubjectsToSocialModuleProfilesConfiguration(),
          ),
        ),
        subjectsToRoles: new CRUDService<any>(
          new RbacSubjectsToRolesRepository(
            new RbacSubjectsToRolesConfiguration(),
          ),
        ),
        rolesToEcommerceModuleProducts: new CRUDService<any>(
          new RbacRolesToEcommerceModuleProductsRepository(
            new RbacRolesToEcommerceModuleProductsConfiguration(),
          ),
        ),
      };
    })
    .inSingletonScope();
  bind<IEcommerceModule>(AgentDI.IEcommerceModule)
    .toDynamicValue(() => {
      return {
        order: new CRUDService<any>(
          new EcommerceOrderRepository(new EcommerceOrderConfiguration()),
        ),
        product: new CRUDService<any>(
          new EcommerceProductRepository(new EcommerceProductConfiguration()),
        ),
        attribute: new CRUDService<any>(
          new EcommerceAttributeRepository(
            new EcommerceAttributeConfiguration(),
          ),
        ),
        attributeKey: new CRUDService<any>(
          new EcommerceAttributeKeyRepository(
            new EcommerceAttributeKeyConfiguration(),
          ),
        ),
        productsToAttributes: new CRUDService<any>(
          new EcommerceProductsToAttributesRepository(
            new EcommerceProductsToAttributesConfiguration(),
          ),
        ),
        productsToFileStorageModuleFiles: new CRUDService<any>(
          new EcommerceProductsToFileStorageModuleFilesRepository(
            new EcommerceProductsToFileStorageModuleFilesConfiguration(),
          ),
        ),
        attributeKeysToAttributes: new CRUDService<any>(
          new EcommerceAttributeKeysToAttributesRepository(
            new EcommerceAttributeKeysToAttributesConfiguration(),
          ),
        ),
        attributesToBillingModuleCurrencies: new CRUDService<any>(
          new EcommerceAttributesToBillingModuleCurrenciesRepository(
            new EcommerceAttributesToBillingModuleCurrenciesConfiguration(),
          ),
        ),
      };
    })
    .inSingletonScope();
  bind<IBillingModule>(AgentDI.IBillingModule)
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
        invoice: new CRUDService<any>(
          new BillingInvoiceRepository(new BillingInvoiceConfiguration()),
        ),
      };
    })
    .inSingletonScope();
  bind<INotificationModule>(AgentDI.INotificationModule)
    .toDynamicValue(() => {
      return {
        notification: new CRUDService<any>(
          new NotificationNotificationRepository(
            new NotificationNotificationConfiguration(),
          ),
        ),
      };
    })
    .inSingletonScope();
  bind<IFileStorageModule>(AgentDI.IFileStorageModule)
    .toDynamicValue(() => {
      return {
        file: new CRUDService<any>(
          new FileStorageFileRepository(new FileStorageFileConfiguration()),
        ),
      };
    })
    .inSingletonScope();
  bind<IBroadcastModule>(AgentDI.IBroadcastModule)
    .toDynamicValue(() => {
      return {
        channel: new CRUDService<any>(
          new BroadcastChannelRepository(new BroadcastChannelConfiguration()),
        ),
        message: new CRUDService<any>(
          new BroadcastMessageRepository(new BroadcastMessageConfiguration()),
        ),
      };
    })
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
