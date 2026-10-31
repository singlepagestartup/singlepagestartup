/**
 * BDD Suite: shared module application composition.
 * Given: initialized child applications and a module registry.
 * When: a module initializes, describes routes or runs data tooling.
 * Then: shared composition preserves routing, lifecycle order and type filters.
 */
import { Hono } from "hono";
import { Container, inject, injectable } from "inversify";
import { App } from "./index";
import type { IApp, IModuleApps, IModuleAppEntry } from "./interface";
import type { IExceptionFilter } from "../../filters";
import { DI } from "../../di/constants";
import type { IDumpResult, ISeedResult } from "../../configuration";

const filter: IExceptionFilter = {
  catch: async (error, c) => c.json({ message: error.message }, 500),
};
const resource = { table: "public.items", columns: ["id"], references: [] };

function child(): IModuleAppEntry["app"] {
  const hono = new Hono();
  hono.get("/", (c) => c.json({ data: "item" }));
  return {
    hono,
    describeRoutes: jest.fn(() => [{ route: "", resource }]),
    dump: jest.fn(),
    seed: jest.fn(),
  };
}

it("uses the same nested prefixes for HTTP routing and serializable descriptions", async () => {
  const leaf = child();
  const branch = new App(filter, () => ({
    apps: [{ type: "model", route: "/items", app: leaf }],
  }));
  await branch.init();
  const root = new App(filter, () => ({
    apps: [{ type: "model", route: "/catalog", app: branch }],
  }));
  await root.init();
  expect(root.describeRoutes()).toEqual([
    { route: "/catalog/items", resource },
  ]);
  expect(JSON.parse(JSON.stringify(root.describeRoutes()))).toEqual(
    root.describeRoutes(),
  );
  expect(leaf.describeRoutes()).toEqual([{ route: "", resource }]);
  const response = await root.hono.request("/catalog/items");
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ data: "item" });
});

it("waits for module configuration before mounting routes and uses its error filter", async () => {
  const order: string[] = [];
  class Configured extends App {
    protected override async configureApps() {
      order.push("configure");
      await Promise.resolve();
      order.push("configured");
    }
    override useRoutes() {
      order.push("routes");
      super.useRoutes();
      this.hono.get("/failure", () => {
        throw Error("module failure");
      });
    }
  }
  const app = new Configured(filter, () => {
    order.push("registry");
    return { apps: [] };
  });
  expect(order).toEqual([]);
  await app.init();
  expect(order).toEqual(["registry", "configure", "configured", "routes"]);
  const response = await app.hono.request("/failure");
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ message: "module failure" });
});

it("preserves dump and seed type filters and flattens child results", async () => {
  const model = child(),
    relation = child();
  const dump: IDumpResult = {
    module: "test",
    name: "items",
    type: "model",
    dumps: [],
  };
  const seed: ISeedResult = {
    module: "test",
    name: "links",
    type: "relation",
    seeds: [],
  };
  jest.mocked(model.dump).mockResolvedValue([dump]);
  jest.mocked(relation.seed).mockResolvedValue([seed]);
  const app = new App(filter, () => ({
    apps: [
      { type: "model", route: "/items", app: model },
      { type: "relation", route: "/links", app: relation },
    ],
  }));
  await app.init();
  expect(await app.dump()).toEqual([]);
  expect(await app.seed()).toEqual([]);
  expect(model.dump).not.toHaveBeenCalled();
  expect(relation.seed).not.toHaveBeenCalled();
  expect(await app.dump({ type: "model", dumps: [] })).toEqual([dump]);
  expect(relation.dump).not.toHaveBeenCalled();
  const props = { type: "relation" as const, seeds: [seed] };
  expect(await app.seed(props)).toEqual([seed]);
  expect(relation.seed).toHaveBeenCalledWith(props);
  expect(model.seed).not.toHaveBeenCalled();
});

it("resolves a derived module through its interface without constructing the registry early", async () => {
  const create = jest.fn(
    (): IModuleApps => ({
      apps: [{ type: "model", route: "/items", app: child() }],
    }),
  );
  @injectable()
  class Derived extends App {
    constructor(
      @inject(DI.IExceptionFilter) exceptionFilter: IExceptionFilter,
    ) {
      super(exceptionFilter, create);
    }
  }
  const container = new Container();
  container.bind<IExceptionFilter>(DI.IExceptionFilter).toConstantValue(filter);
  container.bind<IApp>(DI.IApp).to(Derived);
  const app = container.get<IApp>(DI.IApp);
  expect(create).not.toHaveBeenCalled();
  await app.init();
  expect(create).toHaveBeenCalledTimes(1);
  expect(app.apps.apps).toHaveLength(1);
  expect(app.describeRoutes()).toEqual([{ route: "/items", resource }]);
});
