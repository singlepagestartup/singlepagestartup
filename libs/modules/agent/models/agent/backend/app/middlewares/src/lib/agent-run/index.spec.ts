/**
 * BDD Suite: a dispatched agent closes its own run.
 *
 * Given: an agent route reached with a cron run id.
 * When: the handler returns or throws.
 * Then: the run is finished with the observed outcome, and a request without a
 * run id leaves the markers untouched.
 */

const mockLoggerError = jest.fn();

jest.mock("@sps/agent/models/agent/sdk/model", () => ({
  runIdHeader: "X-SPS-AGENT-RUN-ID",
}));

jest.mock("@sps/backend-utils", () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

import { Hono } from "hono";
import { Middleware } from ".";

const route = "/api/agent/agents/host-module-page-cache";

function createService() {
  return {
    agentRun: {
      markFinished: jest.fn().mockResolvedValue(true),
    },
  };
}

function createApp(props: {
  service: ReturnType<typeof createService>;
  handler: () => Response | Promise<Response>;
}) {
  const app = new Hono();

  app.use(route, new Middleware(props.service).init());
  app.post(route, () => props.handler());

  return app;
}

describe("Given: an agent route that the cron runner dispatched", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: a completed handler finishes its run.
   *
   * Given: a handler that answers successfully after the runner left.
   * When: the request completes.
   * Then: the run is finished with the response status.
   */
  it("Then: records the run as finished with the response status", async () => {
    const service = createService();
    const app = createApp({
      service,
      handler: () => new Response(JSON.stringify({ data: { ok: true } })),
    });

    const res = await app.request(route, {
      method: "POST",
      headers: { "X-SPS-AGENT-RUN-ID": "run-1" },
    });

    expect(res.status).toBe(200);
    expect(service.agentRun.markFinished).toHaveBeenCalledWith({
      slug: "host-module-page-cache",
      runId: "run-1",
      result: { status: 200, ok: true },
    });
  });

  /**
   * BDD Scenario: a thrown handler still finishes its run.
   *
   * Given: a handler that throws while the runner is already gone.
   * When: the application turns the exception into an error response.
   * Then: the run is finished with that status instead of staying open.
   */
  it("Then: records the run as finished when the handler throws", async () => {
    const service = createService();
    const app = createApp({
      service,
      handler: () => {
        throw new Error("Internal error. Failed to warm the cache");
      },
    });

    const res = await app.request(route, {
      method: "POST",
      headers: { "X-SPS-AGENT-RUN-ID": "run-1" },
    });

    expect(res.status).toBe(500);
    expect(service.agentRun.markFinished).toHaveBeenCalledWith({
      slug: "host-module-page-cache",
      runId: "run-1",
      result: {
        status: 500,
        error: "Internal error. Agent responded with 500",
      },
    });
  });

  /**
   * BDD Scenario: an error that escapes the chain still finishes the run.
   *
   * Given: a downstream chain that rejects instead of answering.
   * When: the middleware propagates the rejection.
   * Then: the run is finished with the error before the rejection is rethrown.
   */
  it("Then: records the run as finished when the chain rejects", async () => {
    const service = createService();
    const middleware = new Middleware(service).init();
    const context = {
      req: {
        header: () => "run-1",
        path: route,
      },
    } as any;

    await expect(
      middleware(context, async () => {
        throw new Error("Internal error. Failed to warm the cache");
      }),
    ).rejects.toThrow("Internal error. Failed to warm the cache");

    expect(service.agentRun.markFinished).toHaveBeenCalledWith({
      slug: "host-module-page-cache",
      runId: "run-1",
      result: { error: "Internal error. Failed to warm the cache" },
    });
  });

  /**
   * BDD Scenario: a manual call is not a scheduled run.
   *
   * Given: a request without a run id.
   * When: the handler answers.
   * Then: no marker is written.
   */
  it("Then: leaves the markers untouched without a run id", async () => {
    const service = createService();
    const app = createApp({
      service,
      handler: () => new Response(JSON.stringify({ data: { ok: true } })),
    });

    const res = await app.request(route, { method: "POST" });

    expect(res.status).toBe(200);
    expect(service.agentRun.markFinished).not.toHaveBeenCalled();
  });
});
