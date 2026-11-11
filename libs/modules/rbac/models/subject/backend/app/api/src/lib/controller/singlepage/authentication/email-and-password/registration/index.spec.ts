import { Hono } from "hono";
jest.mock("@sps/backend-utils", () => ({
  authorization: (c: any) =>
    c.req.header("Authorization")?.replace("Bearer ", ""),
  getHttpErrorType: (error: Error) => ({ status: 401, message: error.message }),
}));
import { Handler } from "./index";

it("gets the visitor Subject from the verified session and ignores a body Subject ID", async () => {
  const token = "visitor-access-token";
  const me = jest.fn().mockResolvedValue({ id: "visitor" });
  const authenticate = jest
    .fn()
    .mockResolvedValue({ jwt: token, refresh: "test-refresh" });
  const handler = new Handler({
    me,
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
  expect(me).toHaveBeenCalledWith({ token });
  expect(response.status).toBe(201);
  expect(response.headers.get("set-cookie")).toBeNull();
  expect(authenticate).toHaveBeenCalledWith(
    expect.objectContaining({ type: "registration", subjectId: "visitor" }),
  );
});

it("rejects an invalid session before registering an account", async () => {
  const authenticate = jest.fn();
  const handler = new Handler({
    me: jest.fn().mockResolvedValue(null),
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
