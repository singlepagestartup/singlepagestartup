import { ContainerModule } from "inversify";
import {
  createAppBootstrap,
  DI,
  ExceptionFilter,
  type IAppAssembly,
  type IExceptionFilter,
} from "@sps/shared-backend-api";
import { createService as createProduct } from "@sps/ecommerce/models/product/backend/app/api/src/lib/bootstrap";
import { createService as createOfferAttribute } from "@sps/ecommerce/relations/stores-to-products-to-attributes/backend/app/api/src/lib/bootstrap";
import { createService as createProductAttribute } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/bootstrap";
import { createService as createStoreAttribute } from "@sps/ecommerce/relations/stores-to-attributes/backend/app/api/src/lib/bootstrap";
import { createService as createAttribute } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/bootstrap";
import { createService as createAttributeKey } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/bootstrap";
import { createService as createKeyValue } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/bootstrap";
import { createService as createValueCurrency } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/bootstrap";
import { createService as createCurrency } from "@sps/billing/models/currency/backend/app/api/src/lib/bootstrap";
import { createService as createReservations } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/bootstrap";
import { createService as createLinks } from "@sps/ecommerce/relations/offers-to-offers/backend/app/api/src/lib/bootstrap";
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
  return new Catalog({
    offers,
    get links() {
      return createLinks(assembly);
    },
    get products() {
      return createProduct(assembly);
    },
    get offerAttributes() {
      return createOfferAttribute(assembly);
    },
    get productAttributes() {
      return createProductAttribute(assembly);
    },
    get storeAttributes() {
      return createStoreAttribute(assembly);
    },
    get attributes() {
      return createAttribute(assembly);
    },
    get attributeKeys() {
      return createAttributeKey(assembly);
    },
    get keyValues() {
      return createKeyValue(assembly);
    },
    get valueCurrencies() {
      return createValueCurrency(assembly);
    },
    get currencies() {
      return createCurrency(assembly);
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
