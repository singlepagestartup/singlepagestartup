jest.mock("@sps/shared-utils", () => ({ RBAC_JWT_SECRET: "test-jwt-secret" }));
jest.mock("@sps/backend-utils", () => ({
  authorization: (context: any) => context.req.header("authorization"),
  readRbacSecret: (context: any) => context.req.header("X-RBAC-SECRET-KEY"),
  rbacSecretMatches: (secret: string) => secret === "operator-secret",
  verifyJwt: async (token: string) => {
    if (token === "expired") throw new Error("expired");
    return { subject: { id: token } };
  },
}));
import { Hono } from "hono";
import { Middleware } from ".";

function fixture() {
  const service = {
    subjectsToRoles: { find: jest.fn().mockResolvedValue([]) },
    rolesToPermissions: { find: jest.fn().mockResolvedValue([]) },
    permission: { find: jest.fn().mockResolvedValue([]) },
  };
  const app = new Hono();
  app.use("*", new Middleware(() => service).init());
  app.get("*", (context) => context.json({ data: { private: true } }));
  return { service, app };
}
it.each([
  "/api/social/profiles",
  "/api/social/profiles/count",
  "/api/social/profiles/61ed455d-8cce-458f-9992-a12e1fcb449a",
  "/api/social/profiles/%7B61ED455D8CCE458F9992A12E1FCB449A%7D",
])(
  "denies anonymous, guest and ordinary raw Profile read: %s",
  async (path) => {
    const { app } = fixture();
    for (const token of [undefined, "guest", "ordinary", "expired"]) {
      const response = await app.request(path, {
        headers: token ? { authorization: token } : {},
      });
      expect(response.status).toBe(403);
    }
  },
);
it("keeps named public author projections and scoped nested routes outside this guard", async () => {
  const { app, service } = fixture();
  for (const path of [
    "/api/social/profiles/authors",
    "/api/social/profiles/authors/count",
    "/api/social/profiles/authors/61ed455d-8cce-458f-9992-a12e1fcb449a",
    "/api/social/profiles/owned/chats",
  ])
    expect((await app.request(path)).status).toBe(200);
  expect(service.subjectsToRoles.find).not.toHaveBeenCalled();
});
it("allows the operator and rechecks explicit administrative bindings on each request", async () => {
  const { app, service } = fixture();
  expect(
    (
      await app.request("/api/social/profiles", {
        headers: { "X-RBAC-SECRET-KEY": "operator-secret" },
      })
    ).status,
  ).toBe(200);
  service.subjectsToRoles.find.mockResolvedValue([
    { subjectId: "admin", roleId: "admin-role" },
  ]);
  service.permission.find.mockResolvedValue([
    {
      id: "read-profile",
      path: "/api/social/profiles",
      method: "GET",
      type: "HTTP",
    },
  ]);
  service.rolesToPermissions.find.mockResolvedValue([
    { roleId: "admin-role", permissionId: "read-profile" },
  ]);
  const accepted = await app.request("/api/social/profiles", {
    headers: { authorization: "admin" },
  });
  expect(accepted.status).toBe(200);
  expect(accepted.headers.get("cache-control")).toBe("private, no-store");
  service.rolesToPermissions.find.mockResolvedValue([]);
  expect(
    (
      await app.request("/api/social/profiles", {
        headers: { authorization: "admin" },
      })
    ).status,
  ).toBe(403);
});
it("does not admit a roleless route policy and honors an explicitly bound root Permission", async () => {
  const { app, service } = fixture();
  service.subjectsToRoles.find.mockResolvedValue([
    { subjectId: "registered", roleId: "user-role" },
  ]);
  service.permission.find.mockResolvedValue([
    { id: "root", path: "*", method: "*", type: "HTTP" },
  ]);
  expect(
    (
      await app.request("/api/social/profiles/count", {
        method: "HEAD",
        headers: { authorization: "registered" },
      })
    ).status,
  ).toBe(403);
  service.rolesToPermissions.find.mockResolvedValue([
    { roleId: "user-role", permissionId: "root" },
  ]);
  expect(
    (
      await app.request("/api/social/profiles/count", {
        method: "HEAD",
        headers: { authorization: "registered" },
      })
    ).status,
  ).toBe(200);
});
