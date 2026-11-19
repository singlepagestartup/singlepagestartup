import { createService as createAttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/bootstrap";
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
import type { Service as OrdersToBillingModulePaymentIntentsService } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api";
import { Repository as PaymentIntentRepository } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/repository";
import { Configuration as PaymentIntentConfiguration } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/configuration";
import { Service as OrderPayment } from "./service/startup/payment";
import type { Service as BillingPaymentIntentService } from "@sps/billing/models/payment-intent/backend/app/api";
import { Service as FindByIdCheckoutAttributesService } from "./service/startup/find-by-id/checkout-attributes";
import { Service as FindByIdTotalService } from "./service/startup/find-by-id/total";
import { Service as FindByIdQuantityService } from "./service/startup/find-by-id/quantity";
import { createModule } from "./service/module";

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
    .toDynamicValue(({ get }) => {
      const assembly = get<IAppAssembly>(DI.IAppAssembly);
      const module = assembly.getOrCreate(createModule);
      const { product, ordersToProducts } = module;
      const attributeKey = createAttributeKeyService(assembly);
      const { attribute, productsToAttributes } = product.module;
      return new FindByIdCheckoutAttributesService(
        attributeKey,
        ordersToProducts,
        product,
        productsToAttributes,
        attributeKey.module.attributeKeysToAttributes,
        attribute,
        attribute.module.attributesToBillingModuleCurrencies,
      );
    })
    .inSingletonScope();
  bind<FindByIdTotalService>(OrderDI.IFindByIdTotalService)
    .toDynamicValue(({ get }) => {
      const assembly = get<IAppAssembly>(DI.IAppAssembly);
      const { ordersToProducts } = assembly.getOrCreate(createModule);
      return new FindByIdTotalService(
        createAttributeKeyService(assembly),
        ordersToProducts,
      );
    })
    .inSingletonScope();
  bind<FindByIdQuantityService>(OrderDI.IFindByIdQuantityService)
    .toDynamicValue(({ get }) => {
      const assembly = get<IAppAssembly>(DI.IAppAssembly);
      const { ordersToProducts } = assembly.getOrCreate(createModule);
      return new FindByIdQuantityService(ordersToProducts);
    })
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
      .toDynamicValue(
        () =>
          reservations ??
          assembly.getOrCreate(createModule)
            .ordersToBillingModulePaymentIntents,
      )
      .inSingletonScope();
    container
      .bind<BillingPaymentIntentService>(OrderDI.IPaymentIntentService)
      .toDynamicValue(({ get }) => {
        if (paymentIntent) {
          return paymentIntent;
        }

        const payment = new OrderPayment(
          new PaymentIntentRepository(new PaymentIntentConfiguration()),
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
