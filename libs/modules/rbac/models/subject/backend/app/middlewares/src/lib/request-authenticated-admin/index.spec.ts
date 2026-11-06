import { Hono } from "hono";
import { sign } from "hono/jwt";
import { Middleware } from "./index";

jest.mock("@sps/shared-utils", () => ({
  RBAC_JWT_SECRET: "test-key",
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS: 300,
}));

jest.mock("@sps/backend-utils", () => ({
  verifyJwt: (token: string, secret: string) =>
    jest.requireActual("hono/jwt").verify(token, secret, "HS256"),
}));

const authenticationMe = jest.fn();
const isAdmin = jest.fn();
const invalidate = jest.fn();
const app = new Hono().post(
  "/host-cache/revalidate",
  new Middleware().init({ authenticationMe, isAdmin }),
  (c) => {
    invalidate();
    return c.json({ data: { ok: true } });
  },
);

async function token(lifetime = 300) {
  const iat = Math.floor(Date.now() / 1000);
  return sign(
    { iat, exp: iat + lifetime, subject: { id: "subject" } },
    "test-key",
  );
}

function request(headers?: HeadersInit) {
  return app.request("/host-cache/revalidate", { method: "POST", headers });
}

beforeEach(() => {
  jest.resetAllMocks();
  authenticationMe.mockResolvedValue({ authenticated: true });
  isAdmin.mockResolvedValue(true);
});

it("requires an access token in the Authorization header", async () => {
  expect((await request()).status).toBe(401);
  expect(
    (await request({ Cookie: `rbac.subject.jwt=${await token()}` })).status,
  ).toBe(401);
  expect((await request({ "X-RBAC-SECRET-KEY": "operator" })).status).toBe(401);
  expect((await request({ Authorization: "Bearer invalid" })).status).toBe(401);
  expect(
    (await request({ Authorization: `Bearer ${await token(3600)}` })).status,
  ).toBe(401);
  expect(authenticationMe).not.toHaveBeenCalled();
  expect(invalidate).not.toHaveBeenCalled();
});

it("rejects an anonymous Subject even if its JWT is valid", async () => {
  authenticationMe.mockResolvedValue({ authenticated: false });
  const response = await request({ Authorization: `Bearer ${await token()}` });
  expect(response.status).toBe(401);
  expect(isAdmin).not.toHaveBeenCalled();
  expect(invalidate).not.toHaveBeenCalled();
});

it("checks the current role before each operation", async () => {
  const headers = { Authorization: `Bearer ${await token()}` };
  expect((await request(headers)).status).toBe(200);
  isAdmin.mockResolvedValue(false);
  expect((await request(headers)).status).toBe(403);
  expect(authenticationMe).toHaveBeenCalledWith({ subjectId: "subject" });
  expect(isAdmin).toHaveBeenCalledTimes(2);
  expect(invalidate).toHaveBeenCalledTimes(1);
});
