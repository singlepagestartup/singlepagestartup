import { Container, ContainerModule } from "inversify";
import {
  DI,
  ExceptionFilter,
  type IExceptionFilter,
} from "@sps/shared-backend-api";
import { Configuration } from "./configuration";
import { Repository } from "./repository";
import { Controller } from "./controller";
import { Service } from "./service";
import { App } from "./app";
import { OfferDI } from "./di";
import { Service as Catalog } from "./service/startup/catalog";
import { createService as createProductService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/bootstrap";
import { Repository as OfferAttributeRepository } from "@sps/ecommerce/relations/stores-to-products-to-attributes/backend/app/api/src/lib/repository";
import { Configuration as OfferAttributeConfiguration } from "@sps/ecommerce/relations/stores-to-products-to-attributes/backend/app/api/src/lib/configuration";
import { Service as OfferAttributeService } from "@sps/ecommerce/relations/stores-to-products-to-attributes/backend/app/api/src/lib/service";
import { Repository as ProductAttributeRepository } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/repository";
import { Configuration as ProductAttributeConfiguration } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/configuration";
import { Service as ProductAttributeService } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/service";
import { Repository as StoreAttributeRepository } from "@sps/ecommerce/relations/stores-to-attributes/backend/app/api/src/lib/repository";
import { Configuration as StoreAttributeConfiguration } from "@sps/ecommerce/relations/stores-to-attributes/backend/app/api/src/lib/configuration";
import { Service as StoreAttributeService } from "@sps/ecommerce/relations/stores-to-attributes/backend/app/api/src/lib/service";
import { createService as createAttributeService } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/bootstrap";
import { Repository as AttributeKeyRepository } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/repository";
import { Configuration as AttributeKeyConfiguration } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/configuration";
import { Service as AttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/service";
import { Repository as KeyValueRepository } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/repository";
import { Configuration as KeyValueConfiguration } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/configuration";
import { Service as KeyValueService } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/service";
import { Repository as ValueCurrencyRepository } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/repository";
import { Configuration as ValueCurrencyConfiguration } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/configuration";
import { Service as ValueCurrencyService } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Repository as CurrencyRepository } from "@sps/billing/models/currency/backend/app/api/src/lib/repository";
import { Configuration as CurrencyConfiguration } from "@sps/billing/models/currency/backend/app/api/src/lib/configuration";
import { Service as CurrencyService } from "@sps/billing/models/currency/backend/app/api/src/lib/service";
import { createService as createReservationsService } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/bootstrap";
import { Repository as LinksRepository } from "@sps/ecommerce/relations/offers-to-offers/backend/app/api/src/lib/repository";
import { Configuration as LinksConfiguration } from "@sps/ecommerce/relations/offers-to-offers/backend/app/api/src/lib/configuration";
import { Service as LinksService } from "@sps/ecommerce/relations/offers-to-offers/backend/app/api/src/lib/service";
import type { IConstructorProps as ICatalogDependencies } from "./service/singlepage/catalog";

function createCatalog(offers: ICatalogDependencies["offers"]) {
  const products = createProductService();
  return new Catalog({
    offers,
    links: new LinksService(
      new LinksRepository(new LinksConfiguration()),
      offers,
      products,
    ),
    products,
    offerAttributes: new OfferAttributeService(
      new OfferAttributeRepository(new OfferAttributeConfiguration()),
    ),
    productAttributes: new ProductAttributeService(
      new ProductAttributeRepository(new ProductAttributeConfiguration()),
    ),
    storeAttributes: new StoreAttributeService(
      new StoreAttributeRepository(new StoreAttributeConfiguration()),
    ),
    attributes: createAttributeService(),
    attributeKeys: new AttributeKeyService(
      new AttributeKeyRepository(new AttributeKeyConfiguration()),
    ),
    keyValues: new KeyValueService(
      new KeyValueRepository(new KeyValueConfiguration()),
    ),
    valueCurrencies: new ValueCurrencyService(
      new ValueCurrencyRepository(new ValueCurrencyConfiguration()),
    ),
    currencies: new CurrencyService(
      new CurrencyRepository(new CurrencyConfiguration()),
    ),
  });
}

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service).inSingletonScope();
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<Catalog>(OfferDI.ICatalogService).toDynamicValue(({ get }) =>
    createCatalog({ find: (props) => get<Service>(DI.IService).find(props) }),
  );
  bind(OfferDI.IReservationsService).toDynamicValue(() =>
    createReservationsService(),
  );
});

export function createService(): Service {
  const container = new Container();
  container.load(bindings);
  return container.get<Service>(DI.IService);
}

export async function bootstrap() {
  const container = new Container();
  container.load(bindings);
  const app = container.get<App>(DI.IApp);

  await app.init();

  return { app };
}
