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
import { OfferLinksDI } from "./di";
import { Configuration as OfferConfiguration } from "@sps/ecommerce/relations/stores-to-products/backend/app/api/src/lib/configuration";
import { Repository as OfferRepository } from "@sps/ecommerce/relations/stores-to-products/backend/app/api/src/lib/repository";
import { createService as createProductsService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/bootstrap";

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller).inSingletonScope();
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service).inSingletonScope();
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind(OfferLinksDI.IProductsService).toDynamicValue(({ get }) =>
    createProductsService(get<IAppAssembly>(DI.IAppAssembly)),
  );
});

export function createOfferLinksBootstrap(
  createOfferReader?: (assembly: IAppAssembly) => Pick<OfferRepository, "find">,
) {
  return createAppBootstrap<App, Service>(bindings, (container, assembly) => {
    container
      .bind<Pick<OfferRepository, "find">>(OfferLinksDI.IOfferReader)
      .toDynamicValue(
        () =>
          createOfferReader?.(assembly) ??
          new OfferRepository(new OfferConfiguration()),
      )
      .inSingletonScope();
  });
}

export const serviceBootstrap = createOfferLinksBootstrap();
export const { bootstrap, createService } = serviceBootstrap;
