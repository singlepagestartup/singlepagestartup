import { ContainerModule } from "inversify";
import {
  createAppBootstrap,
  DI,
  ExceptionFilter,
  type IAppAssembly,
  type IExceptionFilter,
} from "@sps/shared-backend-api";
import { createService as createStoreAttribute } from "@sps/ecommerce/relations/stores-to-attributes/backend/app/api/src/lib/bootstrap";
import { createService as createAttributeKey } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/bootstrap";
import { createService as createReservations } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/bootstrap";
import { createModules } from "@sps/ecommerce/backend/app/api/src/lib/modules";
import { createModule } from "./service/module";
import { Configuration } from "./configuration";
import { Repository } from "./repository";
import { Controller } from "./controller";
import { Service } from "./service";
import { App } from "./app";
import { OfferDI } from "./di";
import { Service as Catalog } from "./service/startup/catalog";
import type { IConstructorProps as ICatalogDependencies } from "./service/singlepage/catalog";

function createCatalog(
  assembly: IAppAssembly,
  offers: ICatalogDependencies["offers"],
) {
  const module = assembly.getOrCreate(createModule);
  const modules = assembly.getOrCreate(createModules);
  return new Catalog({
    offers,
    get links() {
      return module.offersToOffers;
    },
    get products() {
      return module.product;
    },
    get offerAttributes() {
      return module.storesToProductsToAttributes;
    },
    get productAttributes() {
      return module.product.module.productsToAttributes;
    },
    get storeAttributes() {
      return createStoreAttribute(assembly);
    },
    get attributes() {
      return module.attribute;
    },
    get attributeKeys() {
      return createAttributeKey(assembly);
    },
    get keyValues() {
      return createAttributeKey(assembly).module.attributeKeysToAttributes;
    },
    get valueCurrencies() {
      return module.attribute.module.attributesToBillingModuleCurrencies;
    },
    get currencies() {
      return modules.billing.currency;
    },
  });
}

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller).inSingletonScope();
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service).inSingletonScope();
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<Catalog>(OfferDI.ICatalogService).toDynamicValue(({ get }) =>
    createCatalog(get<IAppAssembly>(DI.IAppAssembly), {
      find: (props) => get<Service>(DI.IService).find(props),
    }),
  );
  bind(OfferDI.IReservationsService).toDynamicValue(({ get }) =>
    createReservations(get<IAppAssembly>(DI.IAppAssembly)),
  );
});

export const serviceBootstrap = createAppBootstrap<App, Service>(bindings);
export const { bootstrap, createService } = serviceBootstrap;
