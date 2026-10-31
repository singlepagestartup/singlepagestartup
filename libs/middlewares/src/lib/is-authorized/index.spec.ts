import { Hono } from "hono";
import { Middleware } from "./index";
import { api } from "@sps/rbac/models/subject/sdk/server";
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: { authenticationIsAuthorized: jest.fn() },
}));
function app() {
  const app = new Hono();
  app.use("*", new Middleware().init());
  app.get("/api/host/metadata", (c) => c.json({ data: [] }));
  app.get("/api/private/records", (c) => c.json({ data: [] }));
  return app;
}
beforeEach(() => jest.resetAllMocks());
it("leaves public collection reads available with ordinary variant filters", async () => {
  const result = await app().request(
    "/api/host/metadata?filters[and][0][column]=variant&filters[and][0][method]=eq&filters[and][0][value]=hidden",
  );
  expect(result.status).toBe(200);
  expect(api.authenticationIsAuthorized).not.toHaveBeenCalled();
});
it("checks the requested GET permission rather than a collection POST permission", async () => {
  jest.mocked(api.authenticationIsAuthorized).mockResolvedValue({} as any);
  const result = await app().request("/api/private/records", {
    headers: { Authorization: "Bearer reader-test-token" },
  });
  expect(result.status).toBe(200);
  expect(api.authenticationIsAuthorized).toHaveBeenCalledWith(
    expect.objectContaining({
      params: {
        permission: {
          route: "/api/private/records",
          method: "GET",
          type: "HTTP",
        },
      },
    }),
  );
});
it("rejects an anonymous request when the permission service denies access", async () => {
  jest
    .mocked(api.authenticationIsAuthorized)
    .mockRejectedValue(new Error("Forbidden error. Denied"));
  expect(
    (await app().request("/api/private/records")).status,
  ).toBeGreaterThanOrEqual(400);
});
it("rejects an authenticated caller denied access to the requested resource", async () => {
  jest
    .mocked(api.authenticationIsAuthorized)
    .mockRejectedValue(new Error("Forbidden error. Denied"));
  const result = await app().request("/api/private/records", {
    headers: { Authorization: "Bearer denied-test-token" },
  });
  expect(result.status).toBeGreaterThanOrEqual(400);
});
