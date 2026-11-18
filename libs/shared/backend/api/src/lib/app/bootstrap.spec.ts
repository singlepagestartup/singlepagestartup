import { ContainerModule } from "inversify";
import { DI } from "../di/constants";
import { createAppBootstrap } from "./bootstrap";

function fixture() {
  const makeService = jest.fn(() => ({ id: Symbol() }));
  const init = jest.fn(async () => {});
  const bindings = new ContainerModule(({ bind }) => {
    bind(DI.IService).toDynamicValue(makeService).inSingletonScope();
    bind(DI.IController).toDynamicValue(({ get }) => ({
      service: get<ReturnType<typeof makeService>>(DI.IService),
    }));
    bind(DI.IApp).toDynamicValue(({ get }) => ({
      controller: get(DI.IController),
      init,
    }));
  });
  type Service = ReturnType<typeof makeService>;
  const owner = createAppBootstrap<
    { controller: { service: Service }; init: typeof init },
    Service
  >(bindings);
  return { owner, makeService, init };
}

it("shares one service before and after concurrent HTTP startup", async () => {
  const { owner, makeService, init } = fixture();
  const service = owner.createService();
  expect(init).not.toHaveBeenCalled();
  const [first, second] = await Promise.all([
    owner.bootstrap(),
    owner.bootstrap(),
  ]);
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
  const { owner, init } = fixture();
  const service = owner.createService();
  init.mockRejectedValueOnce(new Error("startup failed"));
  await expect(owner.bootstrap()).rejects.toThrow("startup failed");
  expect((await owner.bootstrap()).app.controller.service).toBe(service);
  expect(init).toHaveBeenCalledTimes(2);
});
