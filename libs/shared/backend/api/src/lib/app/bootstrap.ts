import { Container, type ContainerModule } from "inversify";
import { DI } from "../di/constants";
import type { IApp, IAppRouteDescription } from "./default/interface";

const getServiceOverride = Symbol("getServiceOverride");
const parentAppAssembly = Symbol("parentAppAssembly");
const constructing = Symbol("constructing");
export const bindServiceAppAssembly = Symbol("bindServiceAppAssembly");

type CreateService = (assembly: IAppAssembly) => unknown;

export interface IAppAssembly {
  readonly [parentAppAssembly]?: IAppAssembly;
  [getServiceOverride](
    owner: IServiceBootstrap<unknown>,
  ): CreateService | undefined;
  getOrCreate<T>(factory: (assembly: IAppAssembly) => T): T;
}

export interface IServiceBootstrap<TService> {
  createService(assembly?: IAppAssembly): TService;
}

export interface IAppBootstrap<
  TApp,
  TService,
> extends IServiceBootstrap<TService> {
  bootstrap(assembly?: IAppAssembly): Promise<{ app: TApp; service: TService }>;
  describeRoutes(assembly?: IAppAssembly): IAppRouteDescription[];
}

export interface IAppAssemblyOverrides {
  overrideService<TService>(
    owner: IServiceBootstrap<TService>,
    service: NoInfer<TService>,
  ): void;
  overrideServiceWith<TService>(
    owner: IServiceBootstrap<TService>,
    factory: (assembly: IAppAssembly) => NoInfer<TService>,
  ): void;
}

export function createAppAssembly(
  configure?: (overrides: IAppAssemblyOverrides) => void,
): IAppAssembly {
  return buildAppAssembly(configure);
}

export function createChildAppAssembly(
  parent: IAppAssembly,
  configure: (overrides: IAppAssemblyOverrides) => void,
): IAppAssembly {
  return buildAppAssembly(configure, parent);
}

function buildAppAssembly(
  configure?: (overrides: IAppAssemblyOverrides) => void,
  parent?: IAppAssembly,
): IAppAssembly {
  const overrides = new WeakMap<IServiceBootstrap<unknown>, CreateService>();
  const values = new WeakMap<
    (assembly: IAppAssembly) => unknown,
    { value: unknown } | typeof constructing
  >();
  let configuring = true;

  function recordOverride(
    owner: IServiceBootstrap<unknown>,
    factory: CreateService,
  ): void {
    if (!configuring) {
      throw new Error("Configure service overrides when creating the assembly");
    }
    overrides.set(owner, factory);
  }

  configure?.({
    overrideService(owner, service) {
      recordOverride(owner, () => service);
    },
    overrideServiceWith: recordOverride,
  });
  configuring = false;

  const assembly: IAppAssembly = {
    [parentAppAssembly]: parent,
    [getServiceOverride](owner) {
      return overrides.get(owner);
    },
    getOrCreate<T>(factory: (assembly: IAppAssembly) => T): T {
      const cached = values.get(factory);
      if (cached === constructing) {
        throw new Error("Circular dependency while assembling API services");
      }
      if (cached) {
        return cached.value as T;
      }

      values.set(factory, constructing);
      try {
        const value = factory(assembly);
        values.set(factory, { value });
        return value;
      } catch (error) {
        values.delete(factory);
        throw error;
      }
    },
  };
  return assembly;
}

export const defaultAppAssembly = createAppAssembly();

export function getOwningAssembly(
  owner: IServiceBootstrap<unknown>,
  assembly: IAppAssembly,
): IAppAssembly {
  const parent = assembly[parentAppAssembly];
  if (parent && !assembly[getServiceOverride](owner)) {
    return getOwningAssembly(owner, parent);
  }
  return assembly;
}

function scopeService<TService>(
  assembly: IAppAssembly,
  service: TService,
): TService {
  if (
    service !== null &&
    typeof service === "object" &&
    bindServiceAppAssembly in service &&
    typeof service[bindServiceAppAssembly] === "function"
  ) {
    service[bindServiceAppAssembly](assembly);
  }
  return service;
}

export function createAppBootstrap<
  TApp extends Pick<IApp, "init">,
  TService = undefined,
>(
  bindings: ContainerModule,
  configure?: (container: Container, assembly: IAppAssembly) => void,
): IAppBootstrap<TApp, TService>;
export function createAppBootstrap<TApp extends Pick<IApp, "init">, TService>(
  bindings: ContainerModule,
  configure?: (container: Container, assembly: IAppAssembly) => void,
) {
  interface IStartup {
    app?: TApp;
    promise?: Promise<{ app: TApp; service: TService | undefined }>;
  }

  function createStartup(): IStartup {
    return {};
  }

  function loadContainer(assembly: IAppAssembly): Container {
    const container = new Container();
    container.bind<IAppAssembly>(DI.IAppAssembly).toConstantValue(assembly);
    container.load(bindings);
    const override = assembly[getServiceOverride](owner);
    if (override) {
      if (container.isBound(DI.IService)) {
        container.unbind(DI.IService);
      }
      container
        .bind(DI.IService)
        .toDynamicValue(() => createService(assembly))
        .inSingletonScope();
    }
    container.onActivation(DI.IService, (_context, service) =>
      scopeService(assembly, service),
    );
    configure?.(container, assembly);
    return container;
  }

  function resolveService(assembly: IAppAssembly): TService | undefined {
    const override = assembly[getServiceOverride](owner);
    if (override) {
      return scopeService(assembly, override(assembly) as TService);
    }

    const container = assembly.getOrCreate(loadContainer);
    return container.get<TService>(DI.IService, { optional: true });
  }

  function createService(requestedAssembly = defaultAppAssembly) {
    const assembly = getOwningAssembly(owner, requestedAssembly);
    return assembly.getOrCreate(resolveService);
  }

  function createApp(assembly: IAppAssembly): TApp {
    const startup = assembly.getOrCreate(createStartup);
    if (!startup.app) {
      createService(assembly);
      const container = assembly.getOrCreate(loadContainer);
      startup.app = container.get<TApp>(DI.IApp);
    }
    return startup.app;
  }

  const owner: IAppBootstrap<TApp, TService | undefined> = {
    createService,
    describeRoutes(requestedAssembly = defaultAppAssembly) {
      const assembly = getOwningAssembly(owner, requestedAssembly);
      const app: TApp & Partial<Pick<IApp, "describeRoutes">> =
        createApp(assembly);
      return app.describeRoutes?.() ?? [];
    },
    bootstrap(requestedAssembly = defaultAppAssembly) {
      const assembly = getOwningAssembly(owner, requestedAssembly);
      const startup = assembly.getOrCreate(createStartup);
      if (!startup.promise) {
        startup.promise = Promise.resolve()
          .then(async () => {
            const service = createService(assembly);
            const app = createApp(assembly);
            await app.init();
            return { app, service };
          })
          .catch((error) => {
            startup.promise = undefined;
            startup.app = undefined;
            throw error;
          });
      }
      return startup.promise;
    },
  };
  return owner;
}
