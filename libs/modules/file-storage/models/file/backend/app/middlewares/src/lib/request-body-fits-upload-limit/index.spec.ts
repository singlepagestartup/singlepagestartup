/**
 * BDD Suite: upload body limit on file routes.
 *
 * Given: a file route composed behind the upload body limit, with
 *        FILE_STORAGE_MAX_UPLOAD_BYTES configured.
 * When: a request arrives with a body under the limit, a body over it with or
 *       without a declared length, or no body at all.
 * Then: bodies within the limit reach the handler, and a body over it is
 *       refused with 413 Payload Too Large, before the handler runs when its
 *       length is declared.
 */

let mockMaxUploadBytes = 64;

jest.mock("@sps/shared-utils", () => {
  return {
    ...jest.requireActual("@sps/shared-utils"),
    get FILE_STORAGE_MAX_UPLOAD_BYTES() {
      return mockMaxUploadBytes;
    },
  };
});

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Middleware } from "./index";

function createUploadRoute() {
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
  hono.post("/", new Middleware().init(), handler);
  hono.get("/", new Middleware().init(), handler);

  return { handler, hono };
}

function streamOf(text: string) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
}

describe("upload body limit on file routes", () => {
  beforeEach(() => {
    mockMaxUploadBytes = 64;
  });

  /**
   * BDD Scenario
   * Given: an upload whose declared length is within the configured limit.
   * When: the upload body limit evaluates it.
   * Then: the handler receives the whole body.
   */
  it("When: the declared body fits the limit Then: the handler receives it", async () => {
    const { handler, hono } = createUploadRoute();
    const body = "x".repeat(64);

    const response = await hono.request("/", {
      method: "POST",
      body,
      headers: { "content-length": String(body.length) },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: 64 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario
   * Given: an upload whose declared length is one byte over the limit.
   * When: the upload body limit evaluates it.
   * Then: the request is refused with 413 Payload Too Large and the handler never runs.
   */
  it("When: the declared body is over the limit Then: it is refused before the handler runs", async () => {
    const { handler, hono } = createUploadRoute();
    const body = "x".repeat(65);

    const response = await hono.request("/", {
      method: "POST",
      body,
      headers: { "content-length": String(body.length) },
    });

    expect(response.status).toBe(413);
    expect(await response.text()).toContain("Payload Too Large");
    expect(handler).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: an upload streamed without a declared length that grows past the limit.
   * When: the handler reads the body.
   * Then: the read fails and the request is refused with 413 Payload Too Large.
   */
  it("When: an undeclared body grows past the limit Then: it is refused as too large", async () => {
    const { hono } = createUploadRoute();

    const response = await hono.request("/", {
      method: "POST",
      body: streamOf("x".repeat(65)),
      duplex: "half",
    } as RequestInit);

    expect(response.status).toBe(413);
    expect(await response.text()).toContain("Payload Too Large");
  });

  /**
   * BDD Scenario
   * Given: a request without a body on a route guarded by the limit.
   * When: the upload body limit evaluates it.
   * Then: the handler runs as before.
   */
  it("When: the request has no body Then: the handler runs", async () => {
    const { handler, hono } = createUploadRoute();

    const response = await hono.request("/");

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario
   * Given: the same upload under a configured limit that is larger than it.
   * When: the upload body limit evaluates it.
   * Then: the handler receives it, so the limit follows FILE_STORAGE_MAX_UPLOAD_BYTES.
   */
  it("When: the configured limit is raised Then: a body refused before is accepted", async () => {
    mockMaxUploadBytes = 1024;
    const { handler, hono } = createUploadRoute();
    const body = "x".repeat(65);

    const response = await hono.request("/", {
      method: "POST",
      body,
      headers: { "content-length": String(body.length) },
    });

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
