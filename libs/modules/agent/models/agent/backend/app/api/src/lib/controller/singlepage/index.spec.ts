/**
 * Given the effective agent controller behind global authorization,
 * when callers use cron, operator, or unrelated credentials,
 * then only the intended callers reach the cron dispatcher.
 */
jest.mock("nanoid", () => ({ nanoid: () => "test-request-id-328" }));
jest.mock("hono/bun", () => ({ createBunWebSocket: jest.fn() }));

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "test-operator-secret-328",
  AGENT_CRON_SECRET: "test-cron-secret-328",
}));

jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    authenticationIsAuthorized: jest.fn(async () => {
      throw new Error("Forbidden error. No permission");
    }),
  },
}));

import { Hono } from "hono";
import { Controller } from "../startup";
import { IsAuthorizedMiddleware } from "@sps/middlewares";

function createApp() {
  const service = {
    find: jest.fn().mockResolvedValue([]),
    agentRun: {
      findChannel: jest.fn().mockResolvedValue({ id: "test-channel" }),
      findMarkers: jest.fn().mockResolvedValue([]),
    },
  };
  const controller = new Controller(service as any);
  const app = new Hono();
  app.use(new IsAuthorizedMiddleware().init());
  for (const route of controller.httpRoutes) {
    const path = `/api/agent/agents${route.path}`;
    for (const middleware of route.middlewares || []) {
      app.use(path, middleware);
    }
    app.on(route.method, path, route.handler);
  }
  return { app, service };
}

describe("Given: the effective agent routes and global authorization", () => {
  it.each<Record<string, string>>([
    { "X-AGENT-CRON-SECRET": "test-cron-secret-328" },
    { "X-RBAC-SECRET-KEY": "test-operator-secret-328" },
    { Cookie: "rbac.secret-key=test-operator-secret-328" },
  ])(
    "Then: the documented credentials reach the dispatcher (%j)",
    async (headers) => {
      const { app, service } = createApp();
      const response = await app.request("/api/agent/agents/cron", {
        method: "POST",
        headers,
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ data: [] });
      expect(service.find).toHaveBeenCalledTimes(1);
    },
  );

  it.each<Record<string, string>>([
    {},
    { "X-AGENT-CRON-SECRET": "wrong-secret" },
    { "X-RBAC-SECRET-KEY": "test-cron-secret-328" },
    { Authorization: "Bearer unrelated-token" },
  ])(
    "Then: missing or unrelated credentials cannot dispatch (%j)",
    async (headers) => {
      const { app, service } = createApp();
      const response = await app.request("/api/agent/agents/cron", {
        method: "POST",
        headers,
      });
      expect(response.status).toBe(401);
      expect(service.find).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["POST", "/api/agent/agents/dummy"],
    ["GET", "/api/agent/agents/cron"],
  ])("Then: the cron key does not authorize %s %s", async (method, path) => {
    const { app, service } = createApp();
    const response = await app.request(path, {
      method,
      headers: { "X-AGENT-CRON-SECRET": "test-cron-secret-328" },
    });
    expect(response.status).toBe(403);
    expect(service.find).not.toHaveBeenCalled();
  });
});
