import { createService as getOrder } from "@sps/ecommerce/models/order/backend/app/api/src/lib/bootstrap";
import { createService as createSubjectsToEcommerceModuleOrdersService } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/bootstrap";
import { Service as EcommerceCatalog } from "./service/startup/ecommerce/catalog";
import type { IConstructorProps as ICatalogDependencies } from "./service/singlepage/ecommerce/catalog";
import { createService as createEcommerceStoreService } from "@sps/ecommerce/models/store/backend/app/api/src/lib/bootstrap";
import { createService as createProductService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/bootstrap";
import { createService as createAttributeService } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/bootstrap";
import { createService as createAttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/bootstrap";
import { createService as createCurrencyService } from "@sps/billing/models/currency/backend/app/api/src/lib/bootstrap";
import { createService as createOfferService } from "@sps/ecommerce/relations/stores-to-products/backend/app/api/src/lib/bootstrap";
import { createService as createOffersToOffersService } from "@sps/ecommerce/relations/offers-to-offers/backend/app/api/src/lib/bootstrap";
import { createService as createStoresToAttributesService } from "@sps/ecommerce/relations/stores-to-attributes/backend/app/api/src/lib/bootstrap";
import { createService as createProductsToAttributesService } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/bootstrap";
import { createService as createStoresToProductsToAttributesService } from "@sps/ecommerce/relations/stores-to-products-to-attributes/backend/app/api/src/lib/bootstrap";
import { createService as createAttributeKeysToAttributesService } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/bootstrap";
import { createService as createAttributesToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/bootstrap";
import { createService as createSubjectsToEcommerceModuleStoresService } from "@sps/rbac/relations/subjects-to-ecommerce-module-stores/backend/app/api/src/lib/bootstrap";
import { createService as createSubjectsToEcommerceModuleProductsService } from "@sps/rbac/relations/subjects-to-ecommerce-module-products/backend/app/api/src/lib/bootstrap";
import { createService as createSubjectsToRolesService } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/bootstrap";
import { createService as createRoleService } from "@sps/rbac/models/role/backend/app/api/src/lib/bootstrap";
import { createService as createBroadcastChannelService } from "@sps/broadcast/models/channel/backend/app/api/src/lib/bootstrap";
import { createService as createNotificationTopicService } from "@sps/notification/models/topic/backend/app/api/src/lib/bootstrap";
import { createService as createNotificationNotificationService } from "@sps/notification/models/notification/backend/app/api/src/lib/bootstrap";
import { Service as SecurityNotifications } from "./service/startup/security-notifications";
import { Service as CrmFormService } from "@sps/crm/models/form/backend/app/api/src/lib/service";
import { Service as CrmRequestService } from "@sps/crm/models/request/backend/app/api/src/lib/service";
import { Service as CrmStepService } from "@sps/crm/models/step/backend/app/api/src/lib/service";
import { Repository as CrmStepRepository } from "@sps/crm/models/step/backend/app/api/src/lib/repository";
import { Configuration as CrmStepConfiguration } from "@sps/crm/models/step/backend/app/api/src/lib/configuration";
import { Service as CrmInputService } from "@sps/crm/models/input/backend/app/api/src/lib/service";
import { Repository as CrmInputRepository } from "@sps/crm/models/input/backend/app/api/src/lib/repository";
import { Configuration as CrmInputConfiguration } from "@sps/crm/models/input/backend/app/api/src/lib/configuration";
import { Service as CrmOptionService } from "@sps/crm/models/option/backend/app/api/src/lib/service";
import { Repository as CrmOptionRepository } from "@sps/crm/models/option/backend/app/api/src/lib/repository";
import { Configuration as CrmOptionConfiguration } from "@sps/crm/models/option/backend/app/api/src/lib/configuration";
import { Service as CrmFormsToRequestsService } from "@sps/crm/relations/forms-to-requests/backend/app/api/src/lib/service";
import { Service as CrmFormsToStepsService } from "@sps/crm/relations/forms-to-steps/backend/app/api/src/lib/service";
import { Repository as CrmFormsToStepsRepository } from "@sps/crm/relations/forms-to-steps/backend/app/api/src/lib/repository";
import { Configuration as CrmFormsToStepsConfiguration } from "@sps/crm/relations/forms-to-steps/backend/app/api/src/lib/configuration";
import { Service as CrmStepsToInputsService } from "@sps/crm/relations/steps-to-inputs/backend/app/api/src/lib/service";
import { Repository as CrmStepsToInputsRepository } from "@sps/crm/relations/steps-to-inputs/backend/app/api/src/lib/repository";
import { Configuration as CrmStepsToInputsConfiguration } from "@sps/crm/relations/steps-to-inputs/backend/app/api/src/lib/configuration";
import { Service as CrmInputsToOptionsService } from "@sps/crm/relations/inputs-to-options/backend/app/api/src/lib/service";
import { Repository as CrmInputsToOptionsRepository } from "@sps/crm/relations/inputs-to-options/backend/app/api/src/lib/repository";
import { Configuration as CrmInputsToOptionsConfiguration } from "@sps/crm/relations/inputs-to-options/backend/app/api/src/lib/configuration";
import { ContainerModule } from "inversify";
import {
  createAppBootstrap,
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
import { createService as createSocialProfileService } from "@sps/social/models/profile/backend/app/api/src/lib/bootstrap";
import { createService as createBlogArticleService } from "@sps/blog/models/article/backend/app/api/src/lib/bootstrap";
import { createService as createBlogCategoryService } from "@sps/blog/models/category/backend/app/api/src/lib/bootstrap";
import { createService as createBlogCategoriesToArticlesService } from "@sps/blog/relations/categories-to-articles/backend/app/api/src/lib/bootstrap";
import { createService as createSocialProfilesToArticlesService } from "@sps/social/relations/profiles-to-blog-module-articles/backend/app/api/src/lib/bootstrap";
import { createService as createSubjectsToArticlesService } from "@sps/rbac/relations/subjects-to-blog-module-articles/backend/app/api/src/lib/bootstrap";
import type { Service as PaymentIntentService } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/service";
import { createService as createBillingInvoiceService } from "@sps/billing/models/invoice/backend/app/api/src/lib/bootstrap";
import { createService as createBillingPaymentIntentsToCurrenciesService } from "@sps/billing/relations/payment-intents-to-currencies/backend/app/api/src/lib/bootstrap";
import { createService as createBillingPaymentIntentsToInvoicesService } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/bootstrap";
import { createService as createEcommerceStoresToOrdersService } from "@sps/ecommerce/relations/stores-to-orders/backend/app/api/src/lib/bootstrap";
import { createService as createEcommerceOrdersToCurrenciesService } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/backend/app/api/src/lib/bootstrap";
import type { Service as OrderPaymentService } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/service";
import {
  SubjectDI,
  type IBlogModule,
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
import { Service as IsAuthorizedService } from "./service/startup/is-authorized";
import { Service as SubjectsToBillingModuleCurrenciesService } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Repository as SubjectsToBillingModuleCurrenciesRepository } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/app/api/src/lib/repository";
import { Configuration as SubjectsToBillingModuleCurrenciesConfiguration } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/app/api/src/lib/configuration";
import { Service as BillRouteService } from "./service/startup/billing/route";
import { Service as EcommerceOrderProceedService } from "./service/startup/ecommerce/order/proceed";
import type {
  ICheckout as IEcommerceProductCheckout,
  IExecuteProps as IEcommerceProductCheckoutProps,
} from "./service/singlepage/ecommerce/product/checkout";
import { Service as IdentityService } from "@sps/rbac/models/identity/backend/app/api/src/lib/service";
import { Repository as IdentityRepository } from "@sps/rbac/models/identity/backend/app/api/src/lib/repository";
import { Configuration as IdentityConfiguration } from "@sps/rbac/models/identity/backend/app/api/src/lib/configuration";
import { Service as RoleService } from "@sps/rbac/models/role/backend/app/api/src/lib/service";
import { Service as PermissionService } from "@sps/rbac/models/permission/backend/app/api/src/lib/service";
import { Repository as PermissionRepository } from "@sps/rbac/models/permission/backend/app/api/src/lib/repository";
import { Configuration as PermissionConfiguration } from "@sps/rbac/models/permission/backend/app/api/src/lib/configuration";
import { Service as PermissionsToBillingModuleCurrenciesService } from "@sps/rbac/relations/permissions-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Repository as PermissionsToBillingModuleCurrenciesRepository } from "@sps/rbac/relations/permissions-to-billing-module-currencies/backend/app/api/src/lib/repository";
import { Configuration as PermissionsToBillingModuleCurrenciesConfiguration } from "@sps/rbac/relations/permissions-to-billing-module-currencies/backend/app/api/src/lib/configuration";
import { Service as RolesToPermissionsService } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/service";
import { Repository as RolesToPermissionsRepository } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/repository";
import { Configuration as RolesToPermissionsConfiguration } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/configuration";
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
import { Repository as SocialSkillRepository } from "@sps/social/models/skill/backend/app/api/src/lib/repository";
import { Configuration as SocialSkillConfiguration } from "@sps/social/models/skill/backend/app/api/src/lib/configuration";
import { Repository as SocialChatRepository } from "@sps/social/models/chat/backend/app/api/src/lib/repository";
import { Configuration as SocialChatConfiguration } from "@sps/social/models/chat/backend/app/api/src/lib/configuration";
import { Repository as SocialThreadRepository } from "@sps/social/models/thread/backend/app/api/src/lib/repository";
import { Configuration as SocialThreadConfiguration } from "@sps/social/models/thread/backend/app/api/src/lib/configuration";
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
import { Repository as SocialProfilesToSkillsRepository } from "@sps/social/relations/profiles-to-skills/backend/app/api/src/lib/repository";
import { Configuration as SocialProfilesToSkillsConfiguration } from "@sps/social/relations/profiles-to-skills/backend/app/api/src/lib/configuration";
import { Repository as SocialProfilesToKnowledgeModuleSourcesRepository } from "@sps/social/relations/profiles-to-knowledge-module-sources/backend/app/api/src/lib/repository";
import { Repository as SocialSkillsToKnowledgeModuleSourcesRepository } from "@sps/social/relations/skills-to-knowledge-module-sources/backend/app/api/src/lib/repository";
import { Repository as SocialMessagesToKnowledgeModuleSourcesRepository } from "@sps/social/relations/messages-to-knowledge-module-sources/backend/app/api/src/lib/repository";
import { Configuration as SocialProfilesToKnowledgeModuleSourcesConfiguration } from "@sps/social/relations/profiles-to-knowledge-module-sources/backend/app/api/src/lib/configuration";
import { Configuration as SocialSkillsToKnowledgeModuleSourcesConfiguration } from "@sps/social/relations/skills-to-knowledge-module-sources/backend/app/api/src/lib/configuration";
import { Configuration as SocialMessagesToKnowledgeModuleSourcesConfiguration } from "@sps/social/relations/messages-to-knowledge-module-sources/backend/app/api/src/lib/configuration";
import { Repository as SocialProfilesToMessagesRepository } from "@sps/social/relations/profiles-to-messages/backend/app/api/src/lib/repository";
import { Configuration as SocialProfilesToMessagesConfiguration } from "@sps/social/relations/profiles-to-messages/backend/app/api/src/lib/configuration";
import { Repository as SocialProfilesToActionsRepository } from "@sps/social/relations/profiles-to-actions/backend/app/api/src/lib/repository";
import { Configuration as SocialProfilesToActionsConfiguration } from "@sps/social/relations/profiles-to-actions/backend/app/api/src/lib/configuration";
import { Repository as SocialProfilesToAttributesRepository } from "@sps/social/relations/profiles-to-attributes/backend/app/api/src/lib/repository";
import { Configuration as SocialProfilesToAttributesConfiguration } from "@sps/social/relations/profiles-to-attributes/backend/app/api/src/lib/configuration";
import { Repository as SocialChatsToMessagesRepository } from "@sps/social/relations/chats-to-messages/backend/app/api/src/lib/repository";
import { Configuration as SocialChatsToMessagesConfiguration } from "@sps/social/relations/chats-to-messages/backend/app/api/src/lib/configuration";
import { Repository as SocialChatsToThreadsRepository } from "@sps/social/relations/chats-to-threads/backend/app/api/src/lib/repository";
import { Configuration as SocialChatsToThreadsConfiguration } from "@sps/social/relations/chats-to-threads/backend/app/api/src/lib/configuration";
import { Repository as SocialChatsToActionsRepository } from "@sps/social/relations/chats-to-actions/backend/app/api/src/lib/repository";
import { Configuration as SocialChatsToActionsConfiguration } from "@sps/social/relations/chats-to-actions/backend/app/api/src/lib/configuration";
import { Repository as SocialThreadsToMessagesRepository } from "@sps/social/relations/threads-to-messages/backend/app/api/src/lib/repository";
import { Configuration as SocialThreadsToMessagesConfiguration } from "@sps/social/relations/threads-to-messages/backend/app/api/src/lib/configuration";
import { Repository as SocialThreadsToActionsRepository } from "@sps/social/relations/threads-to-actions/backend/app/api/src/lib/repository";
import { Configuration as SocialThreadsToActionsConfiguration } from "@sps/social/relations/threads-to-actions/backend/app/api/src/lib/configuration";
import { Repository as SocialMessagesToFileStorageModuleFilesRepository } from "@sps/social/relations/messages-to-file-storage-module-files/backend/app/api/src/lib/repository";
import { Configuration as SocialMessagesToFileStorageModuleFilesConfiguration } from "@sps/social/relations/messages-to-file-storage-module-files/backend/app/api/src/lib/configuration";
import { Repository as SocialAttributeKeysToAttributesRepository } from "@sps/social/relations/attribute-keys-to-attributes/backend/app/api/src/lib/repository";
import { Configuration as SocialAttributeKeysToAttributesConfiguration } from "@sps/social/relations/attribute-keys-to-attributes/backend/app/api/src/lib/configuration";
import { Repository as EcommerceOrderRepository } from "@sps/ecommerce/models/order/backend/app/api/src/lib/repository";
import { Configuration as EcommerceOrderConfiguration } from "@sps/ecommerce/models/order/backend/app/api/src/lib/configuration";
import { Service as EcommerceOrderService } from "@sps/ecommerce/models/order/backend/app/api/src/lib/service";
import { Service as EcommerceOrderFindByIdCheckoutAttributesService } from "@sps/ecommerce/models/order/backend/app/api/src/lib/service/startup/find-by-id/checkout-attributes";
import { Service as EcommerceOrderFindByIdTotalService } from "@sps/ecommerce/models/order/backend/app/api/src/lib/service/startup/find-by-id/total";
import { Service as EcommerceOrderFindByIdQuantityService } from "@sps/ecommerce/models/order/backend/app/api/src/lib/service/startup/find-by-id/quantity";
import { Service as EcommerceProductService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/service";
import { Repository as EcommerceProductRepository } from "@sps/ecommerce/models/product/backend/app/api/src/lib/repository";
import { Configuration as EcommerceProductConfiguration } from "@sps/ecommerce/models/product/backend/app/api/src/lib/configuration";
import { Repository as EcommerceAttributeRepository } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/repository";
import { Configuration as EcommerceAttributeConfiguration } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/configuration";
import { Repository as EcommerceAttributeKeyRepository } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/repository";
import { Configuration as EcommerceAttributeKeyConfiguration } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/configuration";
import { Repository as EcommerceOrdersToProductsRepository } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/repository";
import { Configuration as EcommerceOrdersToProductsConfiguration } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/configuration";
import { Service as EcommerceOrdersToProductsService } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service";
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
import { Service as BillingCurrencyService } from "@sps/billing/models/currency/backend/app/api/src/lib/service";
import { Repository as BillingInvoiceRepository } from "@sps/billing/models/invoice/backend/app/api/src/lib/repository";
import { Configuration as BillingInvoiceConfiguration } from "@sps/billing/models/invoice/backend/app/api/src/lib/configuration";
import { Service as BillingInvoiceService } from "@sps/billing/models/invoice/backend/app/api/src/lib/service";
import { Repository as BillingPaymentIntentsToCurrenciesRepository } from "@sps/billing/relations/payment-intents-to-currencies/backend/app/api/src/lib/repository";
import { Configuration as BillingPaymentIntentsToCurrenciesConfiguration } from "@sps/billing/relations/payment-intents-to-currencies/backend/app/api/src/lib/configuration";
import { Service as BillingPaymentIntentsToCurrenciesService } from "@sps/billing/relations/payment-intents-to-currencies/backend/app/api/src/lib/service";
import { Repository as BillingPaymentIntentsToInvoicesRepository } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/repository";
import { Configuration as BillingPaymentIntentsToInvoicesConfiguration } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/configuration";
import { Service as BillingPaymentIntentsToInvoicesService } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/service";
import { Repository as NotificationTemplateRepository } from "@sps/notification/models/template/backend/app/api/src/lib/repository";
import { Configuration as NotificationTemplateConfiguration } from "@sps/notification/models/template/backend/app/api/src/lib/configuration";
import { Repository as NotificationTopicsToNotificationsRepository } from "@sps/notification/relations/topics-to-notifications/backend/app/api/src/lib/repository";
import { Configuration as NotificationTopicsToNotificationsConfiguration } from "@sps/notification/relations/topics-to-notifications/backend/app/api/src/lib/configuration";
import { Repository as NotificationNotificationsToTemplatesRepository } from "@sps/notification/relations/notifications-to-templates/backend/app/api/src/lib/repository";
import { Configuration as NotificationNotificationsToTemplatesConfiguration } from "@sps/notification/relations/notifications-to-templates/backend/app/api/src/lib/configuration";
import { Repository as FileStorageFileRepository } from "@sps/file-storage/models/file/backend/app/api/src/lib/repository";
import { Configuration as FileStorageFileConfiguration } from "@sps/file-storage/models/file/backend/app/api/src/lib/configuration";
import { Service as FileStorageFileService } from "@sps/file-storage/models/file/backend/app/api/src/lib/service";
import { Repository as CrmFormRepository } from "@sps/crm/models/form/backend/app/api/src/lib/repository";
import { Configuration as CrmFormConfiguration } from "@sps/crm/models/form/backend/app/api/src/lib/configuration";
import { Repository as CrmRequestRepository } from "@sps/crm/models/request/backend/app/api/src/lib/repository";
import { Configuration as CrmRequestConfiguration } from "@sps/crm/models/request/backend/app/api/src/lib/configuration";
import { Repository as CrmFormsToRequestsRepository } from "@sps/crm/relations/forms-to-requests/backend/app/api/src/lib/repository";
import { Configuration as CrmFormsToRequestsConfiguration } from "@sps/crm/relations/forms-to-requests/backend/app/api/src/lib/configuration";

const bindings = new ContainerModule(({ bind }) => {
  const offers = createOfferService();
  const rolesService = createRoleService();
  const subjectRolesService = createSubjectsToRolesService();
  const storeService = createEcommerceStoreService();
  bind<EcommerceCatalog>(SubjectDI.IEcommerceCatalogService)
    .toDynamicValue(({ get }) => {
      const ordersToBillingModulePaymentIntents = get<OrderPaymentService>(
        SubjectDI.IOrderPaymentService,
      );
      return new EcommerceCatalog({
        repository: new Repository(new Configuration()),
        entities: {
          "orders-to-products": new CRUDService(
            new EcommerceOrdersToProductsRepository(
              new EcommerceOrdersToProductsConfiguration(),
            ),
          ),
          "orders-to-billing-module-payment-intents":
            ordersToBillingModulePaymentIntents,
          "subjects-to-ecommerce-module-orders":
            createSubjectsToEcommerceModuleOrdersService(),
          stores: storeService,
          products: createProductService(),
          attributes: createAttributeService(),
          "attribute-keys": createAttributeKeyService(),
          currencies: createCurrencyService(),
          "stores-to-products": offers,
          "offers-to-offers": createOffersToOffersService(),
          "stores-to-attributes": createStoresToAttributesService(),
          "products-to-attributes": createProductsToAttributesService(),
          "stores-to-products-to-attributes":
            createStoresToProductsToAttributesService(),
          "attribute-keys-to-attributes":
            createAttributeKeysToAttributesService(),
          "attributes-to-billing-module-currencies":
            createAttributesToBillingModuleCurrenciesService(),
          "subjects-to-ecommerce-module-stores":
            createSubjectsToEcommerceModuleStoresService(),
          "subjects-to-ecommerce-module-products":
            createSubjectsToEcommerceModuleProductsService(),
        } as unknown as ICatalogDependencies["entities"],
        isAdmin: async (subjectId) => {
          const roles = await rolesService.find({
            params: {
              filters: {
                and: [{ column: "slug", method: "eq", value: "admin" }],
              },
            },
          });
          const ids = roles.map((role) => role.id);
          const links = await subjectRolesService.find({
            params: {
              filters: {
                and: [{ column: "subjectId", method: "eq", value: subjectId }],
              },
            },
          });
          return links.some(
            (link) => link.subjectId === subjectId && ids.includes(link.roleId),
          );
        },
        stock: ordersToBillingModulePaymentIntents,
      });
    })
    .inSingletonScope();

  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service).inSingletonScope();
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<IBlogModule>(SubjectDI.IBlogModule).toConstantValue({
    article: createBlogArticleService(),
    category: createBlogCategoryService(),
    categoriesToArticles: createBlogCategoriesToArticlesService(),
  });
  bind(SubjectDI.ISubjectsToBlogModuleArticlesService).toConstantValue(
    createSubjectsToArticlesService(),
  );
  bind<ISocialModule>(SubjectDI.ISocialModule)
    .toDynamicValue(() => {
      return {
        profile: createSocialProfileService(),
        profilesToBlogModuleArticles: createSocialProfilesToArticlesService(),
        skill: new CRUDService<any>(
          new SocialSkillRepository(new SocialSkillConfiguration()),
        ),
        chat: new CRUDService<any>(
          new SocialChatRepository(new SocialChatConfiguration()),
        ),
        thread: new CRUDService<any>(
          new SocialThreadRepository(new SocialThreadConfiguration()),
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
        profilesToSkills: new CRUDService<any>(
          new SocialProfilesToSkillsRepository(
            new SocialProfilesToSkillsConfiguration(),
          ),
        ),
        profilesToKnowledgeModuleSources: new CRUDService<any>(
          new SocialProfilesToKnowledgeModuleSourcesRepository(
            new SocialProfilesToKnowledgeModuleSourcesConfiguration(),
          ),
        ),
        messagesToKnowledgeModuleSources: new CRUDService<any>(
          new SocialMessagesToKnowledgeModuleSourcesRepository(
            new SocialMessagesToKnowledgeModuleSourcesConfiguration(),
          ),
        ),
        skillsToKnowledgeModuleSources: new CRUDService<any>(
          new SocialSkillsToKnowledgeModuleSourcesRepository(
            new SocialSkillsToKnowledgeModuleSourcesConfiguration(),
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
        chatsToThreads: new CRUDService<any>(
          new SocialChatsToThreadsRepository(
            new SocialChatsToThreadsConfiguration(),
          ),
        ),
        chatsToActions: new CRUDService<any>(
          new SocialChatsToActionsRepository(
            new SocialChatsToActionsConfiguration(),
          ),
        ),
        threadsToMessages: new CRUDService<any>(
          new SocialThreadsToMessagesRepository(
            new SocialThreadsToMessagesConfiguration(),
          ),
        ),
        threadsToActions: new CRUDService<any>(
          new SocialThreadsToActionsRepository(
            new SocialThreadsToActionsConfiguration(),
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
    .toDynamicValue(({ get }) => {
      const ordersToBillingModulePaymentIntents = get<OrderPaymentService>(
        SubjectDI.IOrderPaymentService,
      );
      const paymentIntentService = get<PaymentIntentService>(
        SubjectDI.IPaymentIntentService,
      );
      const attribute = new CRUDService<any>(
        new EcommerceAttributeRepository(new EcommerceAttributeConfiguration()),
      );
      const attributeKey = new CRUDService<any>(
        new EcommerceAttributeKeyRepository(
          new EcommerceAttributeKeyConfiguration(),
        ),
      );
      const storesToOrders = createEcommerceStoresToOrdersService();
      const ordersToBillingModuleCurrencies =
        createEcommerceOrdersToCurrenciesService();
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
        new BillingCurrencyService(
          new BillingCurrencyRepository(new BillingCurrencyConfiguration()),
        ),
        new FileStorageFileService(
          new FileStorageFileRepository(new FileStorageFileConfiguration()),
        ),
      );
      const ordersToProducts = new EcommerceOrdersToProductsService(
        new EcommerceOrdersToProductsRepository(
          new EcommerceOrdersToProductsConfiguration(),
        ),
        product,
        attribute as any,
        attributeKey as any,
        productsToAttributes as any,
        attributeKeysToAttributes as any,
        attributesToBillingModuleCurrencies as any,
        offers,
      );

      const findByIdCheckoutAttributesService =
        new EcommerceOrderFindByIdCheckoutAttributesService(
          attributeKey as any,
          ordersToProducts as any,
          product as any,
          productsToAttributes as any,
          attributeKeysToAttributes as any,
          attribute as any,
          attributesToBillingModuleCurrencies as any,
        );
      const findByIdTotalService = new EcommerceOrderFindByIdTotalService(
        attributeKey as any,
        ordersToProducts as any,
      );
      const findByIdQuantityService = new EcommerceOrderFindByIdQuantityService(
        ordersToProducts as any,
      );
      const billingCurrency = new BillingCurrencyService(
        new BillingCurrencyRepository(new BillingCurrencyConfiguration()),
      );
      const billingPaymentIntentsToCurrencies =
        new BillingPaymentIntentsToCurrenciesService(
          new BillingPaymentIntentsToCurrenciesRepository(
            new BillingPaymentIntentsToCurrenciesConfiguration(),
          ),
        );
      const billingPaymentIntentsToInvoices =
        new BillingPaymentIntentsToInvoicesService(
          new BillingPaymentIntentsToInvoicesRepository(
            new BillingPaymentIntentsToInvoicesConfiguration(),
          ),
        );
      const billingInvoice = new BillingInvoiceService(
        new BillingInvoiceRepository(new BillingInvoiceConfiguration()),
      );
      const order = new EcommerceOrderService(
        new EcommerceOrderRepository(new EcommerceOrderConfiguration()),
        findByIdCheckoutAttributesService,
        findByIdTotalService,
        findByIdQuantityService,
        product as any,
        ordersToProducts as any,
        ordersToBillingModuleCurrencies as any,
        ordersToFileStorageModuleFiles as any,
        productsToFileStorageModuleFiles as any,
        ordersToBillingModulePaymentIntents,
        billingCurrency,
        paymentIntentService,
        billingPaymentIntentsToCurrencies,
        billingPaymentIntentsToInvoices,
        billingInvoice,
        new FileStorageFileService(
          new FileStorageFileRepository(new FileStorageFileConfiguration()),
        ),
      );

      return {
        store: storeService,
        order,
        product,
        storesToProducts: offers,
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
    .toDynamicValue(({ get }) => {
      return {
        currency: new CRUDService<any>(
          new BillingCurrencyRepository(new BillingCurrencyConfiguration()),
        ),
        paymentIntent: get<PaymentIntentService>(
          SubjectDI.IPaymentIntentService,
        ),
        paymentIntentsToCurrencies:
          createBillingPaymentIntentsToCurrenciesService(),
        invoice: createBillingInvoiceService(),
        paymentIntentsToInvoices:
          createBillingPaymentIntentsToInvoicesService(),
      };
    })
    .inSingletonScope();
  bind<INotificationModule>(SubjectDI.INotificationModule)
    .toDynamicValue(() => {
      return {
        topic: createNotificationTopicService(),
        notification: createNotificationNotificationService(),
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
        file: new FileStorageFileService(
          new FileStorageFileRepository(new FileStorageFileConfiguration()),
        ),
      };
    })
    .inSingletonScope();
  bind<ICrmModule>(SubjectDI.ICrmModule)
    .toDynamicValue((context) => {
      const formsToRequests = new CrmFormsToRequestsService(
        new CrmFormsToRequestsRepository(new CrmFormsToRequestsConfiguration()),
      );
      const request = new CrmRequestService(
        new CrmRequestRepository(new CrmRequestConfiguration()),
      );
      return {
        request,
        formsToRequests,
        form: new CrmFormService(
          new CrmFormRepository(new CrmFormConfiguration()),
          context.get<INotificationModule>(SubjectDI.INotificationModule),
          { request, formsToRequests },
        ),
        step: new CrmStepService(
          new CrmStepRepository(new CrmStepConfiguration()),
        ),
        input: new CrmInputService(
          new CrmInputRepository(new CrmInputConfiguration()),
        ),
        option: new CrmOptionService(
          new CrmOptionRepository(new CrmOptionConfiguration()),
        ),
        formsToSteps: new CrmFormsToStepsService(
          new CrmFormsToStepsRepository(new CrmFormsToStepsConfiguration()),
        ),
        stepsToInputs: new CrmStepsToInputsService(
          new CrmStepsToInputsRepository(new CrmStepsToInputsConfiguration()),
        ),
        inputsToOptions: new CrmInputsToOptionsService(
          new CrmInputsToOptionsRepository(
            new CrmInputsToOptionsConfiguration(),
          ),
        ),
      };
    })
    .inSingletonScope();
  bind<SecurityNotifications>(SubjectDI.ISecurityNotificationsService)
    .to(SecurityNotifications)
    .inSingletonScope();
  bind<IBroadcastModule>(SubjectDI.IBroadcastModule)
    .toDynamicValue(() => {
      return {
        channel: createBroadcastChannelService(),
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
    .toDynamicValue(() => rolesService)
    .inSingletonScope();
  bind<PermissionService>(SubjectDI.IPermissionService)
    .toDynamicValue(
      () =>
        new PermissionService(
          new PermissionRepository(new PermissionConfiguration()),
          new PermissionsToBillingModuleCurrenciesService(
            new PermissionsToBillingModuleCurrenciesRepository(
              new PermissionsToBillingModuleCurrenciesConfiguration(),
            ),
          ),
        ),
    )
    .inSingletonScope();
  bind<RolesToPermissionsService>(SubjectDI.IRolesToPermissionsService)
    .toDynamicValue(
      () =>
        new RolesToPermissionsService(
          new RolesToPermissionsRepository(
            new RolesToPermissionsConfiguration(),
          ),
        ),
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
  bind<import("./service/singlepage/ecommerce/order/renewal").IRenewal>(
    SubjectDI.IEcommerceOrderRenewal,
  ).toFactory(
    (context) => (props) =>
      context.get<Service>(DI.IService).ecommerceModuleOrderRenewal(props),
  );
  bind<IEcommerceProductCheckout>(
    SubjectDI.IEcommerceProductCheckout,
  ).toFactory(
    (context) => (props: IEcommerceProductCheckoutProps) =>
      context.get<Service>(DI.IService).ecommerceProductCheckout(props),
  );
});

export const { bootstrap, createService } = createAppBootstrap<App, Service>(
  bindings,
  (container) => {
    const order = getOrder();
    container
      .bind<OrderPaymentService>(SubjectDI.IOrderPaymentService)
      .toConstantValue(order.ordersToBillingModulePaymentIntents);
    container
      .bind<PaymentIntentService>(SubjectDI.IPaymentIntentService)
      .toConstantValue(order.billingModule.paymentIntent);
  },
);
