import { ContainerModule } from "inversify";
import {
  createAppBootstrap,
  DI,
  ExceptionFilter,
  type IExceptionFilter,
} from "@sps/shared-backend-api";
import { Configuration } from "./configuration";
import { Repository } from "./repository";
import { Controller } from "./controller";
import { Service } from "./service";
import { App } from "./app";
import { OfferLinksDI } from "./di";
import { createService as createOffersService } from "@sps/ecommerce/relations/stores-to-products/backend/app/api/src/lib/bootstrap";
import { createService as createProductsService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/bootstrap";

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind(OfferLinksDI.IOffersService).toDynamicValue(() => createOffersService());
  bind(OfferLinksDI.IProductsService).toDynamicValue(() =>
    createProductsService(),
  );
});

export const { bootstrap, createService } = createAppBootstrap<App, Service>(
  bindings,
);
