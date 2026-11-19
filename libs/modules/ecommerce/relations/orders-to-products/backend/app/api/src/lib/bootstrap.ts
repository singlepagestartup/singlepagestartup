import { createService as createAttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/bootstrap";
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
import { OrdersToProductsDI } from "./di";
import { createService as createOfferService } from "@sps/ecommerce/relations/stores-to-products/backend/app/api/src/lib/bootstrap";
import type { Service as OfferService } from "@sps/ecommerce/relations/stores-to-products/backend/app/api/src/lib/service";
import type { Service as AttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/service";

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller).inSingletonScope();
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service).inSingletonScope();
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<OfferService>(OrdersToProductsDI.IOffersService)
    .toDynamicValue(({ get }) =>
      createOfferService(get<IAppAssembly>(DI.IAppAssembly)),
    )
    .inSingletonScope();
  bind<AttributeKeyService>(OrdersToProductsDI.IAttributeKeysService)
    .toDynamicValue(({ get }) =>
      createAttributeKeyService(get<IAppAssembly>(DI.IAppAssembly)),
    )
    .inSingletonScope();
});

export const serviceBootstrap = createAppBootstrap<App, Service>(bindings);
export const { bootstrap, createService } = serviceBootstrap;
