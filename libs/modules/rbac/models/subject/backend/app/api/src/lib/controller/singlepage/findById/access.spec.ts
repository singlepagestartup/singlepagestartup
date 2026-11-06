import { Hono } from "hono";
import { sign } from "hono/jwt";

const globalAuthorization = jest.fn();
jest.mock("nanoid", () => ({ nanoid: () => "subject-read-request" }));
jest.mock("../../../service", () => ({ Service: class {} }));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    authenticationIsAuthorized: (...args: unknown[]) =>
      globalAuthorization(...args),
  },
}));
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_JWT_SECRET: "subject-read-test-secret",
  RBAC_SECRET_KEY: "subject-read-operator-secret",
}));

import { Middleware as IsAuthorizedMiddleware } from "../../../../../../../../../../../../middlewares/src/lib/is-authorized";
import { Controller } from "..";

const ownerId = "12e8b826-d129-411b-a117-21db4c8a194c";
const otherId = "24e8b826-d129-411b-a117-21db4c8a194c";
const jwtSecret = "subject-read-test-secret";

function fixture() {
  const service = {
    findById: jest.fn(async ({ id }: { id: string }) => ({
      id,
      variant: "default",
    })),
    update: jest.fn(async ({ id }: { id: string }) => ({
      id,
      variant: "default",
    })),
    isAuthorized: jest.fn(async (): Promise<{ ok: boolean }> => {
      throw new Error("Permission error. Subject read denied");
    }),
  };
  const controller = new Controller(service as any);
  const app = new Hono();
  app.use(new IsAuthorizedMiddleware().init());
  const subjects = new Hono();
  for (const route of controller.httpRoutes) {
    for (const middleware of route.middlewares || []) {
      subjects.use(route.path, middleware);
    }
    subjects.on(route.method, route.path, route.handler);
  }
  app.route("/api/rbac/subjects", subjects);
  return { app, service };
}

async function token(props: Record<string, unknown> = {}) {
  return sign(
    {
      subject: { id: ownerId },
      exp: Math.floor(Date.now() / 1000) + 60,
      ...props,
    },
    jwtSecret,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  globalAuthorization.mockRejectedValue(new Error("Permission error. Denied"));
});

it.each(["header", "cookie"])(
  "lets a guest session read only its own Subject using a %s JWT",
  async (transport) => {
    const { app, service } = fixture();
    const jwt = await token();
    const headers =
      transport === "header"
        ? { Authorization: `Bearer ${jwt}` }
        : { Cookie: `rbac.subject.jwt=${jwt}` };
    const response = await app.request(
      `/api/rbac/subjects/${ownerId}?filters[or][0][column]=id&filters[or][0][method]=eq&filters[or][0][value]=${otherId}`,
      { headers },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: { id: ownerId, variant: "default" },
    });
    expect(service.findById).toHaveBeenCalledWith({ id: ownerId });
    expect(service.isAuthorized).not.toHaveBeenCalled();
    expect(globalAuthorization).not.toHaveBeenCalled();
  },
);

it("rejects a foreign Subject before reading its data", async () => {
  const { app, service } = fixture();
  const jwt = await token();
  const response = await app.request(`/api/rbac/subjects/${otherId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });

  expect(response.status).toBe(403);
  expect(service.findById).not.toHaveBeenCalled();
  expect(service.isAuthorized).toHaveBeenCalledWith({
    permission: {
      route: `/api/rbac/subjects/${otherId}`,
      method: "GET",
      type: "HTTP",
    },
    authorization: { value: jwt },
  });
});

it("preserves explicit RBAC access to another Subject", async () => {
  const { app, service } = fixture();
  service.isAuthorized.mockResolvedValueOnce({ ok: true });
  const response = await app.request(`/api/rbac/subjects/${otherId}`, {
    headers: { Authorization: `Bearer ${await token()}` },
  });

  expect(response.status).toBe(200);
  expect(service.findById).toHaveBeenCalledWith({ id: otherId });
});

it.each(["missing", "forged", "expired", "no-subject", "wrong-secret"])(
  "rejects %s credentials before reading a Subject",
  async (scenario) => {
    const { app, service } = fixture();
    const headers: Record<string, string> = {};
    if (scenario === "forged")
      headers.Authorization = `Bearer ${await sign({ subject: { id: ownerId } }, "another-secret")}`;
    if (scenario === "expired")
      headers.Authorization = `Bearer ${await token({ exp: Math.floor(Date.now() / 1000) - 60 })}`;
    if (scenario === "no-subject")
      headers.Authorization = `Bearer ${await token({ subject: {} })}`;
    if (scenario === "wrong-secret")
      headers["X-RBAC-SECRET-KEY"] = "wrong-secret";
    const response = await app.request(`/api/rbac/subjects/${ownerId}`, {
      headers,
    });

    expect(response.status).toBe(401);
    expect(service.findById).not.toHaveBeenCalled();
    expect(service.isAuthorized).not.toHaveBeenCalled();
  },
);

it("preserves operator reads without a session JWT", async () => {
  const { app, service } = fixture();
  const response = await app.request(`/api/rbac/subjects/${otherId}`, {
    headers: { "X-RBAC-SECRET-KEY": "subject-read-operator-secret" },
  });

  expect(response.status).toBe(200);
  expect(service.findById).toHaveBeenCalledWith({ id: otherId });
  expect(service.isAuthorized).not.toHaveBeenCalled();
});

it.each(["/", "/count"])(
  "keeps the Subject %s read behind global RBAC",
  async (path) => {
    const { app, service } = fixture();
    const response = await app.request(`/api/rbac/subjects${path}`);
    expect(response.status).toBe(403);
    expect(globalAuthorization).toHaveBeenCalled();
    expect(service.findById).not.toHaveBeenCalled();
  },
);

it("leaves authorized mutations to their existing route handlers", async () => {
  const { app, service } = fixture();
  globalAuthorization.mockResolvedValueOnce({ ok: true });
  const body = new FormData();
  body.set("data", JSON.stringify({ slug: "updated-subject" }));
  const response = await app.request(`/api/rbac/subjects/${otherId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${await token()}` },
    body,
  });
  expect(response.status).toBe(200);
  expect(globalAuthorization).toHaveBeenCalled();
  expect(service.isAuthorized).not.toHaveBeenCalled();
  expect(service.update).toHaveBeenCalledWith({
    id: otherId,
    data: { slug: "updated-subject" },
  });
});
