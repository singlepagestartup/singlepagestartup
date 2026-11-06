jest.mock("nanoid", () => ({ nanoid: () => "test-request-id" }));
jest.mock("hono/bun", () => ({ createBunWebSocket: jest.fn() }));
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "test-internal-key",
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    authenticationIsAuthorized: jest.fn(async () => {
      throw new Error("Forbidden error. No permission");
    }),
  },
}));

import { Hono } from "hono";
import { ExceptionFilter } from "@sps/shared-backend-api";
import { websocketManager } from "@sps/backend-utils";
import { api as channelApi } from "@sps/broadcast/models/channel/sdk/server";
import {
  IsAuthorizedMiddleware,
  ObserverMiddleware,
  RevalidationMiddleware,
} from "@sps/middlewares";
import { App } from "../../app";
import { Configuration } from "../../configuration";
import { Controller } from "../startup";

async function createApp() {
  const service = { cronQueue: { tick: jest.fn() } };
  const model = new App(
    new ExceptionFilter(),
    new Controller(service as any),
    new Configuration(),
  );
  await model.init();
  const app = new Hono();
  app.use(new ObserverMiddleware().init());
  app.use(new RevalidationMiddleware().init());
  app.use(new IsAuthorizedMiddleware().init());
  app.route("/api/agent/agents", model.hono);
  return { app, model, service };
}

afterEach(() => {
  jest.restoreAllMocks();
});

it("coalesces anonymous concurrent ticks before looking up the queue", async () => {
  const { app, service } = await createApp();
  const observer = jest.spyOn(channelApi, "find").mockResolvedValue([]);
  const broadcast = jest
    .spyOn(websocketManager, "broadcastMessage")
    .mockImplementation(() => {});
  const clock = jest.spyOn(Date, "now").mockReturnValue(60_000);
  const responses = await Promise.all(
    Array.from({ length: 20 }, () =>
      app.request("/api/agent/agents/cron", { method: "POST" }),
    ),
  );
  expect(responses.every((r) => r.status === 204)).toBe(true);
  expect(service.cronQueue.tick).toHaveBeenCalledTimes(1);
  expect(observer).toHaveBeenCalledTimes(1);
  const broadcasts = broadcast.mock.calls.length;
  expect(broadcasts).toBeGreaterThan(0);
  clock.mockReturnValue(120_000);
  expect(
    (await app.request("/api/agent/agents/cron", { method: "POST" })).status,
  ).toBe(204);
  expect(service.cronQueue.tick).toHaveBeenCalledTimes(2);
  expect(observer).toHaveBeenCalledTimes(2);
  expect(broadcast).toHaveBeenCalledTimes(broadcasts * 2);
});

it("applies the minute limit only to POST on the Agent cron route", async () => {
  const { model, service } = await createApp();
  jest.spyOn(Date, "now").mockReturnValue(60_000);
  expect((await model.hono.request("/cron", { method: "PUT" })).status).toBe(
    404,
  );
  expect((await model.hono.request("/cron", { method: "POST" })).status).toBe(
    204,
  );
  expect((await model.hono.request("/cron", { method: "PUT" })).status).toBe(
    404,
  );
  expect(service.cronQueue.tick).toHaveBeenCalledTimes(1);
});

it.each([
  ["GET", "/api/agent/agents/cron"],
  ["POST", "/api/agent/agents/dummy"],
])("keeps %s %s protected", async (method, path) => {
  const { app, service } = await createApp();
  expect((await app.request(path, { method })).status).toBe(403);
  expect(service.cronQueue.tick).not.toHaveBeenCalled();
});
