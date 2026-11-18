import { Container, type ContainerModule } from "inversify";
import { DI } from "../di/constants";
import type { IApp } from "./default/interface";

export function createAppBootstrap<
  TApp extends Pick<IApp, "init">,
  TService = never,
  TArgs extends unknown[] = [],
>(
  bindings: ContainerModule,
  configure?: (container: Container, ...args: TArgs) => void,
) {
  function createContainer(args: TArgs) {
    const container = new Container();
    container.load(bindings);
    configure?.(container, ...args);
    return container;
  }

  async function initializeApp(container: Container) {
    const app = container.get<TApp>(DI.IApp);
    await app.init();
    return app;
  }

  return {
    createService(...args: TArgs) {
      return createContainer(args).get<TService>(DI.IService);
    },
    async bootstrap(...args: TArgs) {
      const app = await initializeApp(createContainer(args));
      return { app };
    },
    async bootstrapWithService(...args: TArgs) {
      const container = createContainer(args);
      const app = await initializeApp(container);
      const service = container.get<TService>(DI.IService);
      return { app, service };
    },
  };
}
