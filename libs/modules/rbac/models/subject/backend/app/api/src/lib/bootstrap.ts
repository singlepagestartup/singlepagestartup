import { ContainerModule } from "inversify";
import {
  createAppBootstrap,
  DI,
  ExceptionFilter,
  type IAppAssembly,
  type IExceptionFilter,
} from "@sps/shared-backend-api";
import { Configuration } from "./configuration";
import { Repository } from "./repository";
import { Controller } from "./controller";
import { Service } from "./service";
import { App } from "./app";
import { SubjectDI } from "./di";
import { createModules } from "@sps/rbac/backend/app/api/src/lib/modules";
import { createModule } from "./service/module";
import { Service as EcommerceCatalog } from "./service/startup/ecommerce/catalog";
import type { IConstructorProps as ICatalogDependencies } from "./service/singlepage/ecommerce/catalog";
import { Service as SecurityNotifications } from "./service/startup/security-notifications";
import { Service as IsAuthorizedService } from "./service/startup/is-authorized";
import { Service as EcommerceOrderProceedService } from "./service/startup/ecommerce/order/proceed";

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller).inSingletonScope();
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service).inSingletonScope();
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<SecurityNotifications>(SubjectDI.ISecurityNotificationsService)
    .toDynamicValue(({ get }) => {
      const assembly = get<IAppAssembly>(DI.IAppAssembly);
      const module = assembly.getOrCreate(createModule);
      const modules = assembly.getOrCreate(createModules);
      return new SecurityNotifications({
        get role() {
          return module.role;
        },
        get subjectsToRoles() {
          return module.subjectsToRoles;
        },
        get subjectsToIdentities() {
          return module.subjectsToIdentities;
        },
        get identity() {
          return module.identity;
        },
        get topic() {
          return modules.notification.topic;
        },
        get template() {
          return modules.notification.template;
        },
        get channel() {
          return modules.broadcast.channel;
        },
      });
    })
    .inSingletonScope();
  bind<IsAuthorizedService>(SubjectDI.IIsAuthorizedService)
    .toDynamicValue(({ get }) => {
      const module = get<IAppAssembly>(DI.IAppAssembly).getOrCreate(
        createModule,
      );
      return new IsAuthorizedService(get<Repository>(DI.IRepository), {
        get permission() {
          return module.role.module.permission;
        },
        get rolesToPermissions() {
          return module.role.module.rolesToPermissions;
        },
        get subjectsToRoles() {
          return module.subjectsToRoles;
        },
      });
    })
    .inSingletonScope();
  bind<EcommerceOrderProceedService>(SubjectDI.IEcommerceOrderProceedService)
    .toDynamicValue(({ get }) => {
      const assembly = get<IAppAssembly>(DI.IAppAssembly);
      return new EcommerceOrderProceedService({
        repository: get<Repository>(DI.IRepository),
        module: assembly.getOrCreate(createModule),
        modules: assembly.getOrCreate(createModules),
        ecommerceProductCheckout: (props) =>
          get<Service>(DI.IService).ecommerceProductCheckout(props),
        ecommerceOrderRenewal: (props) =>
          get<Service>(DI.IService).ecommerceModuleOrderRenewal(props),
      });
    })
    .inSingletonScope();
});

export const serviceBootstrap = createAppBootstrap<App, Service>(
  bindings,
  (container, assembly) => {
    const modules = assembly.getOrCreate(createModules);
    const module = assembly.getOrCreate(createModule);
    container
      .bind<EcommerceCatalog>(SubjectDI.IEcommerceCatalogService)
      .toDynamicValue(({ get }) => {
        const { billing, ecommerce } = modules;
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
              return module.subjectsToEcommerceModuleOrders;
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
              return module.subjectsToEcommerceModuleStores;
            },
            get "subjects-to-ecommerce-module-products"() {
              return module.subjectsToEcommerceModuleProducts;
            },
          } as unknown as ICatalogDependencies["entities"],
          isAdmin: async (subjectId) => {
            const roles = await module.role.find({
              params: {
                filters: {
                  and: [{ column: "slug", method: "eq", value: "admin" }],
                },
              },
            });
            const ids = roles.map((role) => role.id);
            const links = await module.subjectsToRoles.find({
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
