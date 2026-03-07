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
import { ProductDI } from "./di";
import { Service as ProductsToAttributesService } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/service";
import { Repository as ProductsToAttributesRepository } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/repository";
import { Configuration as ProductsToAttributesConfiguration } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/configuration";
import { Service as AttributeService } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/service";
import { Repository as AttributeRepository } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/repository";
import { Configuration as AttributeConfiguration } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/configuration";
import { Service as AttributesToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Repository as AttributesToBillingModuleCurrenciesRepository } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/repository";
import { Configuration as AttributesToBillingModuleCurrenciesConfiguration } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/configuration";
import { Service as BillingModuleCurrencyService } from "@sps/billing/models/currency/backend/app/api/src/lib/service";
import { Repository as BillingModuleCurrencyRepository } from "@sps/billing/models/currency/backend/app/api/src/lib/repository";
import { Configuration as BillingModuleCurrencyConfiguration } from "@sps/billing/models/currency/backend/app/api/src/lib/configuration";
import { Service as FileStorageFileService } from "@sps/file-storage/models/file/backend/app/api/src/lib/service";
import { Repository as FileStorageFileRepository } from "@sps/file-storage/models/file/backend/app/api/src/lib/repository";
import { Configuration as FileStorageFileConfiguration } from "@sps/file-storage/models/file/backend/app/api/src/lib/configuration";
import { Service as AttributeKeysToAttributesService } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/service";
import { Repository as AttributeKeysToAttributesRepository } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/repository";
import { Configuration as AttributeKeysToAttributesConfiguration } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/configuration";
import { Service as AttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/service";
import { Repository as AttributeKeyRepository } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/repository";
import { Configuration as AttributeKeyConfiguration } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/configuration";
import { Service as ProductsToFileStorageModuleFilesService } from "@sps/ecommerce/relations/products-to-file-storage-module-files/backend/app/api/src/lib/service";
import { Repository as ProductsToFileStorageModuleFilesRepository } from "@sps/ecommerce/relations/products-to-file-storage-module-files/backend/app/api/src/lib/repository";
import { Configuration as ProductsToFileStorageModuleFilesConfiguration } from "@sps/ecommerce/relations/products-to-file-storage-module-files/backend/app/api/src/lib/configuration";

const bindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<ProductsToAttributesService>(ProductDI.IProductsToAttributesService)
    .toDynamicValue(
      () =>
        new ProductsToAttributesService(
          new ProductsToAttributesRepository(
            new ProductsToAttributesConfiguration(),
          ),
        ),
    )
    .inSingletonScope();
  bind<AttributeService>(ProductDI.IAttributesService)
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
  bind<AttributeKeysToAttributesService>(
    ProductDI.IAttributeKeysToAttributesService,
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
  bind<AttributeKeyService>(ProductDI.IAttributeKeysService)
    .toDynamicValue(
      () =>
        new AttributeKeyService(
          new AttributeKeyRepository(new AttributeKeyConfiguration()),
        ),
    )
    .inSingletonScope();
  bind<AttributesToBillingModuleCurrenciesService>(
    ProductDI.IAttributesToBillingModuleCurrenciesService,
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
  bind<ProductsToFileStorageModuleFilesService>(
    ProductDI.IProductsToFileStorageModuleFilesService,
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
  bind<BillingModuleCurrencyService>(ProductDI.IBillingModuleCurrencyService)
    .toDynamicValue(
      () =>
        new BillingModuleCurrencyService(
          new BillingModuleCurrencyRepository(
            new BillingModuleCurrencyConfiguration(),
          ),
        ),
    )
    .inSingletonScope();
  bind<FileStorageFileService>(ProductDI.IFileStorageModuleFileService)
    .toDynamicValue(
      () =>
        new FileStorageFileService(
          new FileStorageFileRepository(new FileStorageFileConfiguration()),
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
