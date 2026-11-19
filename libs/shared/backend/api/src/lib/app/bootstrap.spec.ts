import { ContainerModule } from "inversify";
import { DI } from "../di/constants";
import type { IRepository } from "../repository/interface";
import { Service as CRUDService } from "../service/crud";
import {
  createAppAssembly,
  createAppBootstrap,
  createChildAppAssembly,
  defaultAppAssembly,
  type IAppAssembly,
} from "./bootstrap";

function fixture() {
  const makeService = jest.fn(() => ({ id: Symbol() }));
  type Service = ReturnType<typeof makeService>;
  const makeController = jest.fn((service: Service) => ({ service }));
  const makeApp = jest.fn((controller: ReturnType<typeof makeController>) => ({
    controller,
    init,
  }));
  const init = jest.fn(async () => {});
  const bindings = new ContainerModule(({ bind }) => {
    bind(DI.IService).toDynamicValue(makeService).inSingletonScope();
    bind(DI.IController)
      .toDynamicValue(({ get }) => makeController(get(DI.IService)))
      .inSingletonScope();
    bind(DI.IApp).toDynamicValue(({ get }) => makeApp(get(DI.IController)));
  });
  const owner = createAppBootstrap<ReturnType<typeof makeApp>, Service>(
    bindings,
  );
  return { owner, makeService, makeController, makeApp, init };
}

it("shares one service before and after concurrent HTTP startup", async () => {
  const { owner, makeService, makeController, init } = fixture();
  const service = owner.createService();
  expect(init).not.toHaveBeenCalled();
  expect(makeController).not.toHaveBeenCalled();
  const startup = owner.bootstrap();
  expect(owner.bootstrap()).toBe(startup);
  const first = await startup;
  const second = await owner.bootstrap();
  expect(second).toBe(first);
  expect(first.service).toBe(service);
  expect(first.app.controller.service).toBe(service);
  expect(owner.createService()).toBe(service);
  expect(makeService).toHaveBeenCalledTimes(1);
  expect(init).toHaveBeenCalledTimes(1);
});

it("keeps independent owners isolated when HTTP starts first", async () => {
  const { owner } = fixture();
  const result = await owner.bootstrap();
  expect(result.service).toBe(owner.createService());
  expect(result.app.controller.service).toBe(result.service);
  expect(fixture().owner.createService()).not.toBe(result.service);
});

it("starts an app-only module with an undefined service", async () => {
  const app = { init: jest.fn(async () => {}) };
  const bindings = new ContainerModule(({ bind }) => {
    bind(DI.IApp).toConstantValue(app);
  });
  const { bootstrap } = createAppBootstrap<typeof app>(bindings);
  expect(await bootstrap()).toStrictEqual({ app, service: undefined });
});

it("can retry failed HTTP initialization with the same service", async () => {
  const { owner, makeController, makeApp, init } = fixture();
  const service = owner.createService();
  init.mockRejectedValueOnce(new Error("startup failed"));
  await expect(owner.bootstrap()).rejects.toThrow("startup failed");
  const result = await owner.bootstrap();
  expect(result.app).not.toBe(makeApp.mock.results[0].value);
  expect(result.app.controller).toBe(makeController.mock.results[0].value);
  expect(result.app.controller.service).toBe(service);
  expect(makeController).toHaveBeenCalledTimes(1);
  expect(init).toHaveBeenCalledTimes(2);
});

it("shares scoped overrides with HTTP in either resolution order", async () => {
  const { owner, makeService, init } = fixture();
  const serviceFirst = { id: Symbol() };
  const httpFirst = { id: Symbol() };
  const firstAssembly = createAppAssembly(({ overrideService }) =>
    overrideService(owner, serviceFirst),
  );
  const secondAssembly = createAppAssembly(({ overrideService }) =>
    overrideService(owner, httpFirst),
  );

  expect(owner.createService(firstAssembly)).toBe(serviceFirst);
  expect(init).not.toHaveBeenCalled();
  const [first, second] = await Promise.all([
    owner.bootstrap(firstAssembly),
    owner.bootstrap(secondAssembly),
  ]);

  expect(first.service).toBe(serviceFirst);
  expect(first.app.controller.service).toBe(serviceFirst);
  expect(second.service).toBe(httpFirst);
  expect(second.app.controller.service).toBe(httpFirst);
  expect(owner.createService(secondAssembly)).toBe(httpFirst);
  expect(makeService).not.toHaveBeenCalled();
  expect(owner.createService()).not.toBe(serviceFirst);
  expect(makeService).toHaveBeenCalledTimes(1);
});

it("inherits untouched owners and uses local overrides in child assemblies", async () => {
  const inherited = fixture().owner;
  const overridden = fixture().owner;
  const parentService = { id: Symbol() };
  const childService = { id: Symbol() };
  const parent = createAppAssembly(({ overrideService }) =>
    overrideService(inherited, parentService),
  );
  const child = createChildAppAssembly(parent, ({ overrideService }) =>
    overrideService(overridden, childService),
  );

  expect(inherited.createService(child)).toBe(parentService);
  expect(inherited.bootstrap(child)).toBe(inherited.bootstrap(parent));
  expect(overridden.createService(child)).toBe(childService);
  expect(overridden.createService(parent)).not.toBe(childService);
  const { app } = await overridden.bootstrap(child);
  expect(app.controller.service).toBe(childService);
});

it("binds the assembly to CRUD services and preserves it on transaction copies", async () => {
  class ScopedService extends CRUDService<{ id: string }> {
    readAssembly() {
      return this.appAssembly;
    }
  }

  const createInstance = () => new ScopedService({} as IRepository);
  const app = { init: jest.fn(async () => {}) };
  const bindings = new ContainerModule(({ bind }) => {
    bind(DI.IService).toDynamicValue(createInstance).inSingletonScope();
    bind(DI.IApp).toConstantValue(app);
  });
  const owner = createAppBootstrap<typeof app, ScopedService>(bindings);
  const replacement = createInstance();
  const overridden = createAppAssembly(({ overrideService }) =>
    overrideService(owner, replacement),
  );
  const isolated = createAppAssembly();
  const service = owner.createService(isolated);
  const transactionCopy: ScopedService = Object.assign(
    Object.create(Object.getPrototypeOf(service)),
    service,
  );

  expect(createInstance().readAssembly()).toBe(defaultAppAssembly);
  expect(owner.createService().readAssembly()).toBe(defaultAppAssembly);
  expect(service.readAssembly()).toBe(isolated);
  expect(transactionCopy.readAssembly()).toBe(isolated);
  expect((await owner.bootstrap(overridden)).service).toBe(replacement);
  expect(replacement.readAssembly()).toBe(overridden);
});

it("resolves a specialized service factory once when HTTP starts first", async () => {
  const { owner, makeService } = fixture();
  const specialized = fixture();
  const replacement = jest.fn((scope: IAppAssembly) =>
    specialized.owner.createService(scope),
  );
  const assembly = createAppAssembly(({ overrideServiceWith }) =>
    overrideServiceWith(owner, replacement),
  );

  expect(replacement).not.toHaveBeenCalled();
  const { app, service } = await owner.bootstrap(assembly);
  expect(service).toBe(specialized.owner.createService(assembly));
  expect(app.controller.service).toBe(service);
  expect(owner.createService(assembly)).toBe(service);
  expect(replacement).toHaveBeenCalledTimes(1);
  expect(makeService).not.toHaveBeenCalled();
});

it("retries failed assembly factories and rejects circular construction", () => {
  const assembly = createAppAssembly();
  const createValue = jest.fn((scope: IAppAssembly) => ({ scope }));
  createValue.mockImplementationOnce(() => {
    throw new Error("failure");
  });
  expect(() => assembly.getOrCreate(createValue)).toThrow("failure");
  const created = assembly.getOrCreate(createValue);
  expect(created.scope).toBe(assembly);
  expect(assembly.getOrCreate(createValue)).toBe(created);
  expect(createValue).toHaveBeenCalledTimes(2);

  function circular(scope: IAppAssembly): object {
    return scope.getOrCreate(circular);
  }
  expect(() => assembly.getOrCreate(circular)).toThrow("Circular dependency");
});
