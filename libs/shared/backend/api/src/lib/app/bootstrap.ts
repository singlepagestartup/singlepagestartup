import { Container, type ContainerModule } from "inversify";
import { DI } from "../di/constants";
import type { IApp } from "./default/interface";

export interface IAppBootstrap<TApp, TService> {
  createService(): TService;
  bootstrap(): Promise<{ app: TApp; service: TService }>;
}

export function createAppBootstrap<
  TApp extends Pick<IApp, "init">,
  TService = undefined,
>(
  bindings: ContainerModule,
  configure?: (container: Container) => void,
): IAppBootstrap<TApp, TService>;
export function createAppBootstrap<TApp extends Pick<IApp, "init">, TService>(
  bindings: ContainerModule,
  configure?: (container: Container) => void,
) {
  let container: Container | undefined;
  let startup:
    Promise<{ app: TApp; service: TService | undefined }> | undefined;

  function getContainer() {
    if (!container) {
      const owner = new Container();
      owner.load(bindings);
      configure?.(owner);
      container = owner;
    }
    return container;
  }

  function createService() {
    return getContainer().get<TService>(DI.IService, { optional: true });
  }

  async function start() {
    const app = getContainer().get<TApp>(DI.IApp);
    await app.init();
    return { app, service: createService() };
  }

  return {
    createService,
    bootstrap() {
      startup ??= start().catch((error) => {
        startup = undefined;
        throw error;
      });
      return startup;
    },
  };
}
