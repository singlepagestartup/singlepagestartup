/**
 * BDD Suite: request body limit.
 *
 * Given: a route composed behind the request body limit, with
 *        API_MAX_REQUEST_BODY_BYTES configured or a limit passed in.
 * When: a request arrives with a body under the limit, a body over it with or
 *       without a declared length, or no body at all.
 * Then: bodies within the limit reach the handler, and a body over it is
 *       refused with 413 Payload Too Large, before the handler runs when its
 *       length is declared.
 */

let mockMaxRequestBodyBytes = 64;

jest.mock("@sps/shared-utils", () => {
  return {
    ...jest.requireActual("@sps/shared-utils"),
    get API_MAX_REQUEST_BODY_BYTES() {
      return mockMaxRequestBodyBytes;
    },
  };
});

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { IMiddlewareOptions, Middleware } from "./index";

function createRoute(options?: IMiddlewareOptions) {
  const handler = jest.fn(async (c: any) => {
    const body = await c.req.text();

    return c.json({ received: body.length });
  });
  const hono = new Hono();

  hono.onError((error, c) => {
    return error instanceof HTTPException
      ? error.getResponse()
      : c.text("Internal Server Error", 500);
  });
  hono.post("/", new Middleware(options).init(), handler);
  hono.get("/", new Middleware(options).init(), handler);

  return { handler, hono };
}

function declared(body: string): RequestInit {
  return {
    method: "POST",
    body,
    headers: { "content-length": String(body.length) },
  };
}

function undeclared(body: string): RequestInit {
  return {
    method: "POST",
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(body));
        controller.close();
      },
    }),
    duplex: "half",
  } as RequestInit;
}

describe("request body limit", () => {
  beforeEach(() => {
    mockMaxRequestBodyBytes = 64;
  });

  /**
   * BDD Scenario
   * Given: a body whose declared length equals the limit.
   * When: the request body limit evaluates it.
   * Then: the handler receives the whole body.
   */
  it("When: the declared body fits the limit Then: the handler receives it", async () => {
    const { handler, hono } = createRoute();

    const response = await hono.request("/", declared("x".repeat(64)));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: 64 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario
   * Given: a body whose declared length is one byte over the limit.
   * When: the request body limit evaluates it.
   * Then: the request is refused with 413 naming the limit, and the handler never runs.
   */
  it("When: the declared body is over the limit Then: it is refused before the handler runs", async () => {
    const { handler, hono } = createRoute();

    const response = await hono.request("/", declared("x".repeat(65)));

    expect(response.status).toBe(413);
    expect(await response.text()).toBe(
      "Payload Too Large error. The request body limit is 64 bytes",
    );
    expect(handler).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a body without a declared length that grows past the limit.
   * When: the handler reads it.
   * Then: the read fails and the request is refused with 413.
   */
  it("When: a body without a declared length grows past the limit Then: it is refused as too large", async () => {
    const { hono } = createRoute();

    const response = await hono.request("/", undeclared("x".repeat(65)));

    expect(response.status).toBe(413);
    expect(await response.text()).toContain("Payload Too Large");
  });

  /**
   * BDD Scenario
   * Given: a body without a declared length that stays within the limit.
   * When: the handler reads it.
   * Then: the handler receives the whole body.
   */
  it("When: a body without a declared length fits the limit Then: the handler receives it", async () => {
    const { hono } = createRoute();

    const response = await hono.request("/", undeclared("x".repeat(64)));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: 64 });
  });

  /**
   * BDD Scenario
   * Given: a request without a body.
   * When: the request body limit evaluates it.
   * Then: the handler runs as before.
   */
  it("When: the request has no body Then: the handler runs", async () => {
    const { handler, hono } = createRoute();

    const response = await hono.request("/");

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario
   * Given: no limit passed to the middleware and API_MAX_REQUEST_BODY_BYTES raised above a body.
   * When: that body arrives, and then again under the lower setting.
   * Then: the body is accepted under the raised setting and refused under the lower one.
   */
  it("When: no limit is passed Then: the limit follows API_MAX_REQUEST_BODY_BYTES", async () => {
    mockMaxRequestBodyBytes = 1024;
    const raised = createRoute();

    const accepted = await raised.hono.request("/", declared("x".repeat(65)));

    mockMaxRequestBodyBytes = 64;
    const lowered = createRoute();

    const refused = await lowered.hono.request("/", declared("x".repeat(65)));

    expect(accepted.status).toBe(200);
    expect(raised.handler).toHaveBeenCalledTimes(1);
    expect(refused.status).toBe(413);
    expect(lowered.handler).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a module route that passes its own limit and name, below the server setting.
   * When: a body over that limit arrives.
   * Then: it is refused with 413 naming the module's limit.
   */
  it("When: a limit and its name are passed Then: the refusal applies and names that limit", async () => {
    mockMaxRequestBodyBytes = 1024;
    const { handler, hono } = createRoute({
      maxBytes: 16,
      limitName: "upload limit",
    });

    const response = await hono.request("/", declared("x".repeat(17)));

    expect(response.status).toBe(413);
    expect(await response.text()).toBe(
      "Payload Too Large error. The upload limit is 16 bytes",
    );
    expect(handler).not.toHaveBeenCalled();
  });
});
