import { Hono } from "hono";
import { Middleware } from "./index";
import { api } from "@sps/rbac/models/subject/sdk/server";
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: { authenticationIsAuthorized: jest.fn() },
}));
function app() {
  const app = new Hono();
  app.use("*", new Middleware().init());
  app.get("/api/host/metadata", (c) =>
    c.json({ hidden: !!c.get("sps.includeHidden" as never) }),
  );
  return app;
}
beforeEach(() => jest.resetAllMocks());
it("leaves anonymous public reads available without administrative visibility", async () => {
  const result = await app().request("/api/host/metadata");
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual({ hidden: false });
  expect(api.authenticationIsAuthorized).not.toHaveBeenCalled();
});
it("refuses forged includeHidden without credentials", async () => {
  const result = await app().request("/api/host/metadata?includeHidden=1");
  expect(result.status).toBeGreaterThanOrEqual(400);
});
it("requires collection write permission before showing hidden records to an editor", async () => {
  jest.mocked(api.authenticationIsAuthorized).mockResolvedValue({} as any);
  const result = await app().request("/api/host/metadata?includeHidden=1", {
    headers: { Authorization: "Bearer editor-test-token" },
  });
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual({ hidden: true });
  expect(api.authenticationIsAuthorized).toHaveBeenCalledWith(
    expect.objectContaining({
      params: {
        permission: {
          route: "/api/host/metadata",
          method: "POST",
          type: "HTTP",
        },
      },
    }),
  );
});
it("does not grant hidden visibility to a token denied write permission", async () => {
  jest
    .mocked(api.authenticationIsAuthorized)
    .mockRejectedValue(new Error("Forbidden error. Denied"));
  const result = await app().request("/api/host/metadata?includeHidden=1", {
    headers: { Authorization: "Bearer denied-test-token" },
  });
  expect(result.status).toBeGreaterThanOrEqual(400);
});
