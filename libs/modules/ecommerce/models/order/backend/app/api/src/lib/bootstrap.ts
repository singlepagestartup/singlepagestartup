import { Container, ContainerModule, interfaces } from "inversify";
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
import { OrderDI } from "./di";
import { Service as ProductService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/service";
import { Repository as ProductRepository } from "@sps/ecommerce/models/product/backend/app/api/src/lib/repository";
import { Configuration as ProductConfiguration } from "@sps/ecommerce/models/product/backend/app/api/src/lib/configuration";
import { Service as AttributeService } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/service";
import { Repository as AttributeRepository } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/repository";
import { Configuration as AttributeConfiguration } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/configuration";
import { Service as AttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/service";
import { Repository as AttributeKeyRepository } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/repository";
import { Configuration as AttributeKeyConfiguration } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/configuration";
import { Service as OrdersToProductsService } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service";
import { Repository as OrdersToProductsRepository } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/repository";
import { Configuration as OrdersToProductsConfiguration } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/configuration";
import { Service as ProductsToAttributesService } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/service";
import { Repository as ProductsToAttributesRepository } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/repository";
import { Configuration as ProductsToAttributesConfiguration } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/configuration";
import { Service as AttributeKeysToAttributesService } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/service";
import { Repository as AttributeKeysToAttributesRepository } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/repository";
import { Configuration as AttributeKeysToAttributesConfiguration } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/configuration";
import { Service as AttributesToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Repository as AttributesToBillingModuleCurrenciesRepository } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/repository";
import { Configuration as AttributesToBillingModuleCurrenciesConfiguration } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/configuration";
import { Service as OrdersToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Repository as OrdersToBillingModuleCurrenciesRepository } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/backend/app/api/src/lib/repository";
import { Configuration as OrdersToBillingModuleCurrenciesConfiguration } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/backend/app/api/src/lib/configuration";
import { Service as OrdersToFileStorageModuleFilesService } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/backend/app/api/src/lib/service";
import { Repository as OrdersToFileStorageModuleFilesRepository } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/backend/app/api/src/lib/repository";
import { Configuration as OrdersToFileStorageModuleFilesConfiguration } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/backend/app/api/src/lib/configuration";
import { Service as ProductsToFileStorageModuleFilesService } from "@sps/ecommerce/relations/products-to-file-storage-module-files/backend/app/api/src/lib/service";
import { Repository as ProductsToFileStorageModuleFilesRepository } from "@sps/ecommerce/relations/products-to-file-storage-module-files/backend/app/api/src/lib/repository";
import { Configuration as ProductsToFileStorageModuleFilesConfiguration } from "@sps/ecommerce/relations/products-to-file-storage-module-files/backend/app/api/src/lib/configuration";
import { Service as OrdersToBillingModulePaymentIntentsService } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/service";
import { Repository as OrdersToBillingModulePaymentIntentsRepository } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/repository";
import { Configuration as OrdersToBillingModulePaymentIntentsConfiguration } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/configuration";
import { Service as BillingModuleCurrencyService } from "@sps/billing/models/currency/backend/app/api/src/lib/service";
import { Repository as BillingModuleCurrencyRepository } from "@sps/billing/models/currency/backend/app/api/src/lib/repository";
import { Configuration as BillingModuleCurrencyConfiguration } from "@sps/billing/models/currency/backend/app/api/src/lib/configuration";

const bindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<ProductService>(OrderDI.IProductsService)
    .toDynamicValue(
      () =>
        new ProductService(
          new ProductRepository(new ProductConfiguration()),
          new ProductsToAttributesService(
            new ProductsToAttributesRepository(
              new ProductsToAttributesConfiguration(),
            ),
          ),
          new AttributeService(
            new AttributeRepository(new AttributeConfiguration()),
            new AttributesToBillingModuleCurrenciesService(
              new AttributesToBillingModuleCurrenciesRepository(
                new AttributesToBillingModuleCurrenciesConfiguration(),
              ),
            ),
            new BillingModuleCurrencyService(
              new BillingModuleCurrencyRepository(
                new BillingModuleCurrencyConfiguration(),
              ),
            ),
          ),
          new AttributeKeysToAttributesService(
            new AttributeKeysToAttributesRepository(
              new AttributeKeysToAttributesConfiguration(),
            ),
          ),
          new AttributeKeyService(
            new AttributeKeyRepository(new AttributeKeyConfiguration()),
          ),
          new AttributesToBillingModuleCurrenciesService(
            new AttributesToBillingModuleCurrenciesRepository(
              new AttributesToBillingModuleCurrenciesConfiguration(),
            ),
          ),
          new ProductsToFileStorageModuleFilesService(
            new ProductsToFileStorageModuleFilesRepository(
              new ProductsToFileStorageModuleFilesConfiguration(),
            ),
          ),
        ),
    )
    .inSingletonScope();
  bind<AttributeService>(OrderDI.IAttributesService)
    .toDynamicValue(
      () =>
        new AttributeService(
          new AttributeRepository(new AttributeConfiguration()),
          new AttributesToBillingModuleCurrenciesService(
            new AttributesToBillingModuleCurrenciesRepository(
              new AttributesToBillingModuleCurrenciesConfiguration(),
            ),
          ),
          new BillingModuleCurrencyService(
            new BillingModuleCurrencyRepository(
              new BillingModuleCurrencyConfiguration(),
            ),
          ),
        ),
    )
    .inSingletonScope();
  bind<AttributeKeyService>(OrderDI.IAttributeKeysService)
    .toDynamicValue(
      () =>
        new AttributeKeyService(
          new AttributeKeyRepository(new AttributeKeyConfiguration()),
        ),
    )
    .inSingletonScope();
  bind<OrdersToProductsService>(OrderDI.IOrdersToProductsService)
    .toDynamicValue(
      () =>
        new OrdersToProductsService(
          new OrdersToProductsRepository(new OrdersToProductsConfiguration()),
        ),
    )
    .inSingletonScope();
  bind<ProductsToAttributesService>(OrderDI.IProductsToAttributesService)
    .toDynamicValue(
      () =>
        new ProductsToAttributesService(
          new ProductsToAttributesRepository(
            new ProductsToAttributesConfiguration(),
          ),
        ),
    )
    .inSingletonScope();
  bind<AttributeKeysToAttributesService>(
    OrderDI.IAttributeKeysToAttributesService,
  )
    .toDynamicValue(
      () =>
        new AttributeKeysToAttributesService(
          new AttributeKeysToAttributesRepository(
            new AttributeKeysToAttributesConfiguration(),
          ),
        ),
    )
    .inSingletonScope();
  bind<AttributesToBillingModuleCurrenciesService>(
    OrderDI.IAttributesToBillingModuleCurrenciesService,
  )
    .toDynamicValue(
      () =>
        new AttributesToBillingModuleCurrenciesService(
          new AttributesToBillingModuleCurrenciesRepository(
            new AttributesToBillingModuleCurrenciesConfiguration(),
          ),
        ),
    )
    .inSingletonScope();
  bind<OrdersToBillingModuleCurrenciesService>(
    OrderDI.IOrdersToBillingModuleCurrenciesService,
  )
    .toDynamicValue(
      () =>
        new OrdersToBillingModuleCurrenciesService(
          new OrdersToBillingModuleCurrenciesRepository(
            new OrdersToBillingModuleCurrenciesConfiguration(),
          ),
        ),
    )
    .inSingletonScope();
  bind<OrdersToFileStorageModuleFilesService>(
    OrderDI.IOrdersToFileStorageModuleFilesService,
  )
    .toDynamicValue(
      () =>
        new OrdersToFileStorageModuleFilesService(
          new OrdersToFileStorageModuleFilesRepository(
            new OrdersToFileStorageModuleFilesConfiguration(),
          ),
        ),
    )
    .inSingletonScope();
  bind<ProductsToFileStorageModuleFilesService>(
    OrderDI.IProductsToFileStorageModuleFilesService,
  )
    .toDynamicValue(
      () =>
        new ProductsToFileStorageModuleFilesService(
          new ProductsToFileStorageModuleFilesRepository(
            new ProductsToFileStorageModuleFilesConfiguration(),
          ),
        ),
    )
    .inSingletonScope();
  bind<OrdersToBillingModulePaymentIntentsService>(
    OrderDI.IOrdersToBillingModulePaymentIntentsService,
  )
    .toDynamicValue(
      () =>
        new OrdersToBillingModulePaymentIntentsService(
          new OrdersToBillingModulePaymentIntentsRepository(
            new OrdersToBillingModulePaymentIntentsConfiguration(),
          ),
        ),
    )
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
