import { Hono } from "hono";
import { sign } from "hono/jwt";
jest.mock("@sps/shared-utils", () => ({ RBAC_JWT_SECRET: "test-jwt-secret" }));
jest.mock("@sps/backend-utils", () => ({
  authorization: (c: any) =>
    c.req.header("Authorization")?.replace("Bearer ", ""),
  getHttpErrorType: (error: Error) => ({ status: 401, message: error.message }),
}));
import { Handler } from "./index";

it("gets the visitor Subject from the verified session and ignores a body Subject ID", async () => {
  const token = await sign(
    { subject: { id: "visitor" }, exp: Math.floor(Date.now() / 1000) + 60 },
    "test-jwt-secret",
  );
  const authenticate = jest
    .fn()
    .mockResolvedValue({ jwt: token, refresh: "test-refresh" });
  const handler = new Handler({
    authenticationLoginAndPassowrd: authenticate,
  } as any);
  const app = new Hono().post("/register", (c, next) =>
    handler.execute(c, next),
  );
  const body = new FormData();
  body.set(
    "data",
    JSON.stringify({
      login: "test@example.com",
      password: "test-password",
      subjectId: "foreign-account",
    }),
  );
  const response = await app.request("/register", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  expect(response.status).toBe(201);
  expect(authenticate).toHaveBeenCalledWith(
    expect.objectContaining({ type: "registration", subjectId: "visitor" }),
  );
});

it("rejects an invalid session before registering an account", async () => {
  const authenticate = jest.fn();
  const handler = new Handler({
    authenticationLoginAndPassowrd: authenticate,
  } as any);
  const app = new Hono().post("/register", (c, next) =>
    handler.execute(c, next),
  );
  const body = new FormData();
  body.set(
    "data",
    JSON.stringify({ login: "test@example.com", password: "test-password" }),
  );
  const response = await app.request("/register", {
    method: "POST",
    headers: { Authorization: "Bearer invalid" },
    body,
  });
  expect(response.status).toBe(401);
  expect(authenticate).not.toHaveBeenCalled();
});
