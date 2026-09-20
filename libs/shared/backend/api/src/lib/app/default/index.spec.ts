/**
 * BDD Suite: default app route registration.
 *
 * Given: a controller whose route list mixes guarded and unguarded routes.
 * When: the default app registers them on its Hono instance.
 * Then: a marked route is guarded before its handler, an unmarked route is
 *       not, and per-route middlewares still run in their declared order.
 */

let mockConfiguredSecret: string | undefined;

jest.mock("@sps/shared-utils", () => ({
  get RBAC_SECRET_KEY() {
    return mockConfiguredSecret;
  },
}));

import { HTTPException } from "hono/http-exception";
import { createMiddleware } from "hono/factory";
import { App } from "./index";
import { Controller } from "../../controllers/rest";
import { type IController } from "../../controllers";

const CONFIGURED_SECRET = "configured-operator-secret";

const createService = () =>
  ({
    find: jest.fn(async () => []),
    count: jest.fn(async () => 0),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    dump: jest.fn(async () => ({ dumps: [] })),
    seed: jest.fn(),
    findOrCreate: jest.fn(),
  }) as any;

const exceptionFilter = {
  catch: (error: any, c: any) => {
    if (error instanceof HTTPException) {
      return error.getResponse();
    }

    return c.json({ error: "Internal server error" }, 500);
  },
} as any;

class CustomController extends Controller<any> {
  constructor(service: any, routes: IController<any>["httpRoutes"]) {
    super(service);
    this.bindHttpRoutes(routes);
  }
}

async function createApp(controller: any) {
  const app = new App(exceptionFilter, controller, {} as any);
  await app.init();

  return app;
}

describe("Given: the default app registers an entity's routes", () => {
  beforeEach(() => {
    mockConfiguredSecret = CONFIGURED_SECRET;
  });

  /**
   * BDD Scenario: an anonymous caller asks for a dump.
   *
   * Given: the default route list, whose dump route is marked secret-only.
   * When: the route is called without a credential.
   * Then: the request is refused and the service never dumps, so no table is
   *       read and no data directory is rewritten.
   */
  it("refuses an anonymous dump before the service runs", async () => {
    const service = createService();
    const app = await createApp(new Controller(service));

    const response = await app.hono.request("/dump");

    expect(response.status).toBe(401);
    expect(service.dump).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: an operator asks for a dump.
   *
   * Given: a caller holding the configured secret.
   * When: the dump route is called with the credential.
   * Then: the service dumps and the response carries its result unchanged.
   */
  it("serves a dump to a caller holding the secret", async () => {
    const service = createService();
    const app = await createApp(new Controller(service));

    const response = await app.hono.request("/dump", {
      headers: { "X-RBAC-SECRET-KEY": CONFIGURED_SECRET },
    });

    expect(response.status).toBe(200);
    expect(service.dump).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toEqual({ data: { dumps: [] } });
  });

  /**
   * BDD Scenario: the read routes stay open.
   *
   * Given: the same app, whose find and count routes carry no mark.
   * When: they are called without a credential.
   * Then: both answer as before, so the anonymous read surface is untouched.
   */
  it("leaves the unmarked read routes open to anonymous callers", async () => {
    const service = createService();
    const app = await createApp(new Controller(service));

    const find = await app.hono.request("/");
    const count = await app.hono.request("/count");

    expect(find.status).toBe(200);
    expect(count.status).toBe(200);
    expect(service.find).toHaveBeenCalledTimes(1);
    expect(service.count).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: a guarded route declares middlewares of its own.
   *
   * Given: a controller that binds a secret-only route with an ownership
   *        middleware.
   * When: an anonymous caller reaches it.
   * Then: the guard answers first, so the route's own middleware never runs on
   *       a request that holds no credential.
   */
  it("runs the guard before a guarded route's own middlewares", async () => {
    const service = createService();
    const ownMiddleware = jest.fn();
    const controller = new CustomController(service, [
      {
        method: "GET",
        path: "/dump",
        handler: Controller.prototype.dump,
        middlewares: [
          createMiddleware(async (c, next) => {
            ownMiddleware();

            return next();
          }),
        ],
      },
    ]);
    const app = await createApp(controller);

    const anonymous = await app.hono.request("/dump");

    expect(anonymous.status).toBe(401);
    expect(ownMiddleware).not.toHaveBeenCalled();

    const authorized = await app.hono.request("/dump", {
      headers: { "X-RBAC-SECRET-KEY": CONFIGURED_SECRET },
    });

    expect(authorized.status).toBe(200);
    expect(ownMiddleware).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: a project re-opens the dump route deliberately.
   *
   * Given: a controller that binds the dump route with requiresSecret false.
   * When: an anonymous caller reaches it.
   * Then: the route answers as it did before the guard, so the startup seam
   *       still works.
   */
  it("keeps a deliberately re-opened dump route anonymous", async () => {
    const service = createService();
    const controller = new CustomController(service, [
      {
        method: "GET",
        path: "/dump",
        handler: Controller.prototype.dump,
        requiresSecret: false,
      },
    ]);
    const app = await createApp(controller);

    const response = await app.hono.request("/dump");

    expect(response.status).toBe(200);
    expect(service.dump).toHaveBeenCalledTimes(1);
  });
});

describe("Given: a deployment configured no operator credential", () => {
  /**
   * BDD Scenario: the dump route fails closed.
   *
   * Given: a deployment with RBAC_SECRET_KEY unset.
   * When: a caller asks for a dump, with or without a credential.
   * Then: both are refused, so an unconfigured deployment dumps for nobody.
   */
  it("refuses every dump when RBAC_SECRET_KEY is unset", async () => {
    mockConfiguredSecret = undefined;
    const service = createService();
    const app = await createApp(new Controller(service));

    const anonymous = await app.hono.request("/dump");
    const credentialed = await app.hono.request("/dump", {
      headers: { "X-RBAC-SECRET-KEY": CONFIGURED_SECRET },
    });

    expect(anonymous.status).toBe(401);
    expect(credentialed.status).toBe(401);
    expect(service.dump).not.toHaveBeenCalled();
  });
});
