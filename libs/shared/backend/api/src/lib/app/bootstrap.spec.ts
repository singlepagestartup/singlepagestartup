import { ContainerModule } from "inversify";
import { DI } from "../di/constants";
import { createAppBootstrap } from "./bootstrap";

function fixture() {
  const makeService = jest.fn(() => ({ id: Symbol() }));
  const init = jest.fn(async () => {});
  const makeApp = jest.fn((service: ReturnType<typeof makeService>) => ({
    service,
    init,
  }));
  const bindings = new ContainerModule(({ bind }) => {
    bind(DI.IService).toDynamicValue(makeService).inSingletonScope();
    bind(DI.IApp).toDynamicValue(({ get }) => makeApp(get(DI.IService)));
  });
  const model = createAppBootstrap<
    ReturnType<typeof makeApp>,
    ReturnType<typeof makeService>
  >(bindings);
  return { model, makeApp, makeService, init };
}

it("can resolve an isolated service without constructing or starting HTTP", () => {
  const { model, makeApp, init } = fixture();
  expect(model.createService()).not.toBe(model.createService());
  expect(makeApp).not.toHaveBeenCalled();
  expect(init).not.toHaveBeenCalled();
});

it("starts a regular app once and returns only the app", async () => {
  const { model, init, makeService } = fixture();
  const result = await model.bootstrap();
  expect(Object.keys(result)).toEqual(["app"]);
  expect(makeService).toHaveBeenCalledTimes(1);
  expect(init).toHaveBeenCalledTimes(1);
});

it("returns the same singleton used by the app when a module exposes its service", async () => {
  const { model, init, makeService } = fixture();
  const { app, service } = await model.bootstrapWithService();
  expect(service).toBe(app.service);
  expect(makeService).toHaveBeenCalledTimes(1);
  expect(init).toHaveBeenCalledTimes(1);
});

it("starts a module that only binds an app", async () => {
  const app = { init: jest.fn(async () => {}) };
  const bindings = new ContainerModule(({ bind }) => {
    bind(DI.IApp).toConstantValue(app);
  });
  const { bootstrap } = createAppBootstrap<typeof app>(bindings);
  expect(await bootstrap()).toEqual({ app });
  expect(app.init).toHaveBeenCalledTimes(1);
});

it("injects the caller's dependencies into both isolated services and HTTP apps", async () => {
  const dependency = Symbol("dependency");
  const bindings = new ContainerModule(({ bind }) => {
    bind(DI.IService).toDynamicValue(({ get }) => get(dependency));
    bind(DI.IApp).toDynamicValue(({ get }) => ({
      service: get(DI.IService),
      init: async () => {},
    }));
  });
  const model = createAppBootstrap<
    { service: string; init(): Promise<void> },
    string,
    [value: string]
  >(bindings, (container, value) => {
    container.bind(dependency).toConstantValue(value);
  });
  expect(model.createService("isolated")).toBe("isolated");
  const { app, service } = await model.bootstrapWithService("configured");
  expect(service).toBe("configured");
  expect(app.service).toBe(service);
});
