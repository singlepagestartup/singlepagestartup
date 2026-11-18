import { ContainerModule } from "inversify";
import {
  createAppBootstrap,
  DI,
  ExceptionFilter,
  type IExceptionFilter,
} from "@sps/shared-backend-api";
import { createService as createPermission } from "@sps/rbac/models/permission/backend/app/api/src/lib/bootstrap";
import { createService as createRolesToPermissions } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/bootstrap";
import { createService as createRolesToEcommerceModuleProducts } from "@sps/rbac/relations/roles-to-ecommerce-module-products/backend/app/api/src/lib/bootstrap";
import { Configuration } from "./configuration";
import { Repository } from "./repository";
import { Controller } from "./controller";
import { Service } from "./service";
import { App } from "./app";
import { SubjectDI, type IBillingModule, type IEcommerceModule } from "./di";
import { createModules } from "./service/modules";
import { Service as EcommerceCatalog } from "./service/startup/ecommerce/catalog";
import type { IConstructorProps as ICatalogDependencies } from "./service/singlepage/ecommerce/catalog";
import { Service as SecurityNotifications } from "./service/startup/security-notifications";
import { Service as IsAuthorizedService } from "./service/startup/is-authorized";
import { Service as BillRouteService } from "./service/startup/billing/route";
import { Service as EcommerceOrderProceedService } from "./service/startup/ecommerce/order/proceed";
import type { IRenewal } from "./service/singlepage/ecommerce/order/renewal";
import type {
  ICheckout as IEcommerceProductCheckout,
  IExecuteProps as IEcommerceProductCheckoutProps,
} from "./service/singlepage/ecommerce/product/checkout";

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller).inSingletonScope();
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service).inSingletonScope();
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<SecurityNotifications>(SubjectDI.ISecurityNotificationsService)
    .to(SecurityNotifications)
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
  bind<IRenewal>(SubjectDI.IEcommerceOrderRenewal).toFactory(
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

export const serviceBootstrap = createAppBootstrap<App, Service>(
  bindings,
  (container, assembly) => {
    const modules = assembly.getOrCreate(createModules);
    container
      .bind<IEcommerceModule>(SubjectDI.IEcommerceModule)
      .toDynamicValue(() => {
        const { ecommerce } = modules;
        return {
          get store() {
            return ecommerce.store;
          },
          get order() {
            return ecommerce.order;
          },
          get product() {
            return ecommerce.product;
          },
          get storesToProducts() {
            return ecommerce.storesToProducts;
          },
          get attribute() {
            return ecommerce.attribute;
          },
          get attributeKey() {
            return ecommerce.attributeKey;
          },
          get storesToOrders() {
            return ecommerce.storesToOrders;
          },
          get ordersToProducts() {
            return ecommerce.ordersToProducts;
          },
          get ordersToBillingModuleCurrencies() {
            return ecommerce.ordersToBillingModuleCurrencies;
          },
          get ordersToBillingModulePaymentIntents() {
            return ecommerce.order.ordersToBillingModulePaymentIntents;
          },
          get ordersToFileStorageModuleFiles() {
            return ecommerce.ordersToFileStorageModuleFiles;
          },
          get productsToAttributes() {
            return ecommerce.productsToAttributes;
          },
          get productsToFileStorageModuleFiles() {
            return ecommerce.productsToFileStorageModuleFiles;
          },
          get attributesToBillingModuleCurrencies() {
            return ecommerce.attributesToBillingModuleCurrencies;
          },
          get attributeKeysToAttributes() {
            return ecommerce.attributeKeysToAttributes;
          },
        };
      })
      .inSingletonScope();
    container
      .bind<IBillingModule>(SubjectDI.IBillingModule)
      .toDynamicValue(() => {
        const { billing, ecommerce } = modules;
        return {
          get currency() {
            return billing.currency;
          },
          get paymentIntent() {
            return ecommerce.order.billingModule.paymentIntent;
          },
          get paymentIntentsToCurrencies() {
            return billing.paymentIntentsToCurrencies;
          },
          get invoice() {
            return billing.invoice;
          },
          get paymentIntentsToInvoices() {
            return billing.paymentIntentsToInvoices;
          },
        };
      })
      .inSingletonScope();
    container
      .bind(SubjectDI.IIdentityService)
      .toDynamicValue(() => modules.rbac.identity)
      .inSingletonScope();
    container
      .bind(SubjectDI.IRoleService)
      .toDynamicValue(() => modules.rbac.role)
      .inSingletonScope();
    container
      .bind(SubjectDI.IPermissionService)
      .toDynamicValue(() => createPermission(assembly))
      .inSingletonScope();
    container
      .bind(SubjectDI.IRolesToPermissionsService)
      .toDynamicValue(() => createRolesToPermissions(assembly))
      .inSingletonScope();
    container
      .bind(SubjectDI.IRolesToEcommerceModuleProductsService)
      .toDynamicValue(() => createRolesToEcommerceModuleProducts(assembly))
      .inSingletonScope();
    container
      .bind(SubjectDI.ISubjectsToBlogModuleArticlesService)
      .toDynamicValue(() => modules.rbac.subjectsToBlogModuleArticles)
      .inSingletonScope();
    container
      .bind(SubjectDI.ISubjectsToRolesService)
      .toDynamicValue(() => modules.rbac.subjectsToRoles)
      .inSingletonScope();
    container
      .bind(SubjectDI.ISubjectsToIdentitiesService)
      .toDynamicValue(() => modules.rbac.subjectsToIdentities)
      .inSingletonScope();
    container
      .bind(SubjectDI.ISubjectsToSocialModuleProfilesService)
      .toDynamicValue(() => modules.rbac.subjectsToSocialModuleProfiles)
      .inSingletonScope();
    container
      .bind(SubjectDI.ISubjectsToEcommerceModuleOrdersService)
      .toDynamicValue(() => modules.rbac.subjectsToEcommerceModuleOrders)
      .inSingletonScope();
    container
      .bind(SubjectDI.ISubjectsToBillingModuleCurrenciesService)
      .toDynamicValue(() => modules.rbac.subjectsToBillingModuleCurrencies)
      .inSingletonScope();
    container
      .bind<EcommerceCatalog>(SubjectDI.IEcommerceCatalogService)
      .toDynamicValue(({ get }) => {
        const { billing, ecommerce, rbac } = modules;
        return new EcommerceCatalog({
          repository: get<Repository>(DI.IRepository),
          entities: {
            get "orders-to-products"() {
              return ecommerce.ordersToProducts;
            },
            get "orders-to-billing-module-payment-intents"() {
              return ecommerce.order.ordersToBillingModulePaymentIntents;
            },
            get "subjects-to-ecommerce-module-orders"() {
              return rbac.subjectsToEcommerceModuleOrders;
            },
            get stores() {
              return ecommerce.store;
            },
            get products() {
              return ecommerce.product;
            },
            get attributes() {
              return ecommerce.attribute;
            },
            get "attribute-keys"() {
              return ecommerce.attributeKey;
            },
            get currencies() {
              return billing.currency;
            },
            get "stores-to-products"() {
              return ecommerce.storesToProducts;
            },
            get "offers-to-offers"() {
              return ecommerce.offersToOffers;
            },
            get "stores-to-attributes"() {
              return ecommerce.storesToAttributes;
            },
            get "products-to-attributes"() {
              return ecommerce.productsToAttributes;
            },
            get "stores-to-products-to-attributes"() {
              return ecommerce.storesToProductsToAttributes;
            },
            get "attribute-keys-to-attributes"() {
              return ecommerce.attributeKeysToAttributes;
            },
            get "attributes-to-billing-module-currencies"() {
              return ecommerce.attributesToBillingModuleCurrencies;
            },
            get "subjects-to-ecommerce-module-stores"() {
              return rbac.subjectsToEcommerceModuleStores;
            },
            get "subjects-to-ecommerce-module-products"() {
              return rbac.subjectsToEcommerceModuleProducts;
            },
          } as unknown as ICatalogDependencies["entities"],
          isAdmin: async (subjectId) => {
            const roles = await rbac.role.find({
              params: {
                filters: {
                  and: [{ column: "slug", method: "eq", value: "admin" }],
                },
              },
            });
            const ids = roles.map((role) => role.id);
            const links = await rbac.subjectsToRoles.find({
              params: {
                filters: {
                  and: [
                    { column: "subjectId", method: "eq", value: subjectId },
                  ],
                },
              },
            });
            return links.some(
              (link) =>
                link.subjectId === subjectId && ids.includes(link.roleId),
            );
          },
          get stock() {
            return ecommerce.order.ordersToBillingModulePaymentIntents;
          },
        });
      })
      .inSingletonScope();
  },
);

export const { bootstrap, createService } = serviceBootstrap;
