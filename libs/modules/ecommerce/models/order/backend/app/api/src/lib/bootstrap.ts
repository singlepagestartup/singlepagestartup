import { createService as createBillingModuleCurrencyService } from "@sps/billing/models/currency/backend/app/api/src/lib/bootstrap";
import { createService as createBillingPaymentIntentsToCurrenciesService } from "@sps/billing/relations/payment-intents-to-currencies/backend/app/api/src/lib/bootstrap";
import { createService as createBillingPaymentIntentsToInvoicesService } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/bootstrap";
import { createService as createBillingInvoiceService } from "@sps/billing/models/invoice/backend/app/api/src/lib/bootstrap";
import { createService as createFileStorageFileService } from "@sps/file-storage/models/file/backend/app/api/src/lib/bootstrap";
import { createService as createProductService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/bootstrap";
import { createService as createAttributeService } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/bootstrap";
import { createService as createAttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/bootstrap";
import { createService as createOrdersToProductsService } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/bootstrap";
import { createService as createProductsToAttributesService } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/bootstrap";
import { createService as createAttributeKeysToAttributesService } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/bootstrap";
import { createService as createAttributesToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/bootstrap";
import { createService as createOrdersToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/backend/app/api/src/lib/bootstrap";
import { createService as createOrdersToFileStorageModuleFilesService } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/backend/app/api/src/lib/bootstrap";
import { createService as createProductsToFileStorageModuleFilesService } from "@sps/ecommerce/relations/products-to-file-storage-module-files/backend/app/api/src/lib/bootstrap";
import { createService as getReservations } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/bootstrap";
import { ContainerModule } from "inversify";
import {
  bindServiceAppAssembly,
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
import { OrderDI } from "./di";
import type { Service as ProductService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/service";
import type { Service as AttributeService } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/service";
import type { Service as AttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/service";
import type { Service as OrdersToProductsService } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service";
import { createService as createOfferService } from "@sps/ecommerce/relations/stores-to-products/backend/app/api/src/lib/bootstrap";
import type { Service as ProductsToAttributesService } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/service";
import type { Service as AttributeKeysToAttributesService } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/service";
import type { Service as AttributesToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/service";
import type { Service as OrdersToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/backend/app/api/src/lib/service";
import type { Service as OrdersToFileStorageModuleFilesService } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/backend/app/api/src/lib/service";
import type { Service as ProductsToFileStorageModuleFilesService } from "@sps/ecommerce/relations/products-to-file-storage-module-files/backend/app/api/src/lib/service";
import type { Service as OrdersToBillingModulePaymentIntentsService } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api";
import type { Service as BillingModuleCurrencyService } from "@sps/billing/models/currency/backend/app/api/src/lib/service";
import { createBillingModule as createPaymentIntentBillingModule } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/bootstrap";
import { Repository as PaymentIntentRepository } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/repository";
import { Configuration as PaymentIntentConfiguration } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/configuration";
import { Service as OrderPayment } from "./service/startup/payment";
import type { Service as BillingPaymentIntentService } from "@sps/billing/models/payment-intent/backend/app/api";
import type { Service as BillingPaymentIntentsToCurrenciesService } from "@sps/billing/relations/payment-intents-to-currencies/backend/app/api/src/lib/service";
import type { Service as BillingPaymentIntentsToInvoicesService } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/service";
import type { Service as BillingInvoiceService } from "@sps/billing/models/invoice/backend/app/api/src/lib/service";
import type { Service as FileStorageFileService } from "@sps/file-storage/models/file/backend/app/api/src/lib/service";
import { Service as FindByIdCheckoutAttributesService } from "./service/startup/find-by-id/checkout-attributes";
import { Service as FindByIdTotalService } from "./service/startup/find-by-id/total";
import { Service as FindByIdQuantityService } from "./service/startup/find-by-id/quantity";

export type IBootstrapResult = Awaited<ReturnType<typeof bootstrap>>;

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller).inSingletonScope();
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service).inSingletonScope();
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<FindByIdCheckoutAttributesService>(
    OrderDI.IFindByIdCheckoutAttributesService,
  )
    .to(FindByIdCheckoutAttributesService)
    .inSingletonScope();
  bind<FindByIdTotalService>(OrderDI.IFindByIdTotalService)
    .to(FindByIdTotalService)
    .inSingletonScope();
  bind<FindByIdQuantityService>(OrderDI.IFindByIdQuantityService)
    .to(FindByIdQuantityService)
    .inSingletonScope();
  bind<BillingModuleCurrencyService>(OrderDI.IBillingModuleCurrencyService)
    .toDynamicValue(({ get }) =>
      createBillingModuleCurrencyService(get<IAppAssembly>(DI.IAppAssembly)),
    )
    .inSingletonScope();
  bind<BillingPaymentIntentsToCurrenciesService>(
    OrderDI.IBillingModulePaymentIntentsToCurrenciesService,
  )
    .toDynamicValue(({ get }) =>
      createBillingPaymentIntentsToCurrenciesService(
        get<IAppAssembly>(DI.IAppAssembly),
      ),
    )
    .inSingletonScope();
  bind<BillingPaymentIntentsToInvoicesService>(
    OrderDI.IBillingModulePaymentIntentsToInvoicesService,
  )
    .toDynamicValue(({ get }) =>
      createBillingPaymentIntentsToInvoicesService(
        get<IAppAssembly>(DI.IAppAssembly),
      ),
    )
    .inSingletonScope();
  bind<BillingInvoiceService>(OrderDI.IBillingModuleInvoiceService)
    .toDynamicValue(({ get }) =>
      createBillingInvoiceService(get<IAppAssembly>(DI.IAppAssembly)),
    )
    .inSingletonScope();
  bind<FileStorageFileService>(OrderDI.IFileStorageModuleFileService)
    .toDynamicValue(({ get }) =>
      createFileStorageFileService(get<IAppAssembly>(DI.IAppAssembly)),
    )
    .inSingletonScope();
  bind<ProductService>(OrderDI.IProductsService)
    .toDynamicValue(({ get }) =>
      createProductService(get<IAppAssembly>(DI.IAppAssembly)),
    )
    .inSingletonScope();
  bind<AttributeService>(OrderDI.IAttributesService)
    .toDynamicValue(({ get }) =>
      createAttributeService(get<IAppAssembly>(DI.IAppAssembly)),
    )
    .inSingletonScope();
  bind<AttributeKeyService>(OrderDI.IAttributeKeysService)
    .toDynamicValue(({ get }) =>
      createAttributeKeyService(get<IAppAssembly>(DI.IAppAssembly)),
    )
    .inSingletonScope();
  bind<OrdersToProductsService>(OrderDI.IOrdersToProductsService)
    .toDynamicValue(({ get }) =>
      createOrdersToProductsService(get<IAppAssembly>(DI.IAppAssembly)),
    )
    .inSingletonScope();
  bind<ProductsToAttributesService>(OrderDI.IProductsToAttributesService)
    .toDynamicValue(({ get }) =>
      createProductsToAttributesService(get<IAppAssembly>(DI.IAppAssembly)),
    )
    .inSingletonScope();
  bind<AttributeKeysToAttributesService>(
    OrderDI.IAttributeKeysToAttributesService,
  )
    .toDynamicValue(({ get }) =>
      createAttributeKeysToAttributesService(
        get<IAppAssembly>(DI.IAppAssembly),
      ),
    )
    .inSingletonScope();
  bind<AttributesToBillingModuleCurrenciesService>(
    OrderDI.IAttributesToBillingModuleCurrenciesService,
  )
    .toDynamicValue(({ get }) =>
      createAttributesToBillingModuleCurrenciesService(
        get<IAppAssembly>(DI.IAppAssembly),
      ),
    )
    .inSingletonScope();
  bind<OrdersToBillingModuleCurrenciesService>(
    OrderDI.IOrdersToBillingModuleCurrenciesService,
  )
    .toDynamicValue(({ get }) =>
      createOrdersToBillingModuleCurrenciesService(
        get<IAppAssembly>(DI.IAppAssembly),
      ),
    )
    .inSingletonScope();
  bind<OrdersToFileStorageModuleFilesService>(
    OrderDI.IOrdersToFileStorageModuleFilesService,
  )
    .toDynamicValue(({ get }) =>
      createOrdersToFileStorageModuleFilesService(
        get<IAppAssembly>(DI.IAppAssembly),
      ),
    )
    .inSingletonScope();
  bind<ProductsToFileStorageModuleFilesService>(
    OrderDI.IProductsToFileStorageModuleFilesService,
  )
    .toDynamicValue(({ get }) =>
      createProductsToFileStorageModuleFilesService(
        get<IAppAssembly>(DI.IAppAssembly),
      ),
    )
    .inSingletonScope();
});

export function createOrderBootstrap(
  reservations?: OrdersToBillingModulePaymentIntentsService,
  paymentIntent?: BillingPaymentIntentService,
) {
  return createAppBootstrap<App, Service>(bindings, (container, assembly) => {
    container
      .bind<OrdersToBillingModulePaymentIntentsService>(
        OrderDI.IOrdersToBillingModulePaymentIntentsService,
      )
      .toDynamicValue(() => reservations ?? getReservations(assembly))
      .inSingletonScope();
    container
      .bind<BillingPaymentIntentService>(
        OrderDI.IBillingModulePaymentIntentService,
      )
      .toDynamicValue(({ get }) => {
        if (paymentIntent) {
          return paymentIntent;
        }

        const payment = new OrderPayment(
          new PaymentIntentRepository(new PaymentIntentConfiguration()),
          createPaymentIntentBillingModule(assembly),
          get<OrdersToBillingModulePaymentIntentsService>(
            OrderDI.IOrdersToBillingModulePaymentIntentsService,
          ),
        );
        payment[bindServiceAppAssembly](assembly);
        return payment;
      })
      .inSingletonScope();
  });
}

export const orderBootstrap = createOrderBootstrap();
export const { bootstrap, createService } = orderBootstrap;
export { orderBootstrap as serviceBootstrap };
