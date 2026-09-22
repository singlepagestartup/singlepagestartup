/// <reference types="jest" />

/**
 * @jest-environment node
 *
 * BDD Suite: Telegram transport route composition.
 *
 * Given: the Telegram controller composes the transport's HTTP route table.
 * When: the composed routes are read.
 * Then: both operator control routes carry the operator credential middleware
 * and the webhook route carries none, because Telegram signs its deliveries.
 */

const mockOperatorSecretHandler = jest.fn();

jest.mock("@sps/middlewares/operator-secret", () => {
  return {
    Middleware: class {
      init() {
        return mockOperatorSecretHandler;
      }
    },
  };
});

jest.mock("./telegram-bot", () => {
  return {
    TelegarmBot: class {},
  };
});

import { Controller } from "./controller";
import { Service } from "./service";
import { TelegarmBot } from "./telegram-bot";

describe("Given: the Telegram transport HTTP route table", () => {
  /**
   * BDD Scenario
   * Given: the Telegram transport binds its HTTP routes.
   * When: the control routes are composed.
   * Then: each control route carries the operator credential middleware and the webhook route does not.
   */
  it("When: the routes are composed Then: only the control routes carry the operator credential", () => {
    const controller = new Controller(new Service(), new TelegarmBot());

    const composed = controller.httpRoutes.map((route) => ({
      route: `${route.method} ${route.path}`,
      middlewares: route.middlewares,
    }));

    expect(composed).toEqual([
      { route: "POST /", middlewares: undefined },
      { route: "POST /run", middlewares: [mockOperatorSecretHandler] },
      { route: "POST /stop", middlewares: [mockOperatorSecretHandler] },
    ]);
  });
});
