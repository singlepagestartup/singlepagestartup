import { Hono } from "hono";
import { randomUUID } from "node:crypto";

const permission = jest.fn();
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    authenticationIsAuthorized: (...args: unknown[]) => permission(...args),
  },
}));
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_JWT_SECRET: "catalogue-route-test",
  RBAC_SECRET_KEY: "catalogue-route-operator",
}));

import { signJwt, verifyJwt } from "@sps/backend-utils";
import { Middleware as IsAuthorizedMiddleware } from "../../../../../../../../../../../../../middlewares/src/lib/is-authorized";
import { Middleware as SubjectOwner } from "../../../../../../../middlewares/src/lib/request-subject-is-owner";
import type { Service } from "../../../../service";
import { Handler } from ".";

const subjectId = randomUUID();
const mutation = jest.fn().mockResolvedValue({ id: randomUUID() });
const authenticationMe = jest.fn();
const service = {
  isAuthorizedService: {
    async getSubjectId(token: string) {
      const claims = await verifyJwt(token, "catalogue-route-test", {
        type: "access",
      });
      return (claims.subject as { id?: string } | undefined)?.id;
    },
  },
  authenticationMe,
  ecommerceCatalog: { mutation },
} as unknown as Service;

async function request(
  props: { callerId?: string; routeSubjectId?: string } = {},
) {
  const app = new Hono();
  app.use(new IsAuthorizedMiddleware().init());
  app.post(
    "/api/rbac/subjects/:id/ecommerce-module/catalogue-mutations",
    new SubjectOwner().init({ requireJwt: true }),
    (c) => new Handler(service, "mutation").execute(c),
  );
  const callerId = props.callerId ?? randomUUID();
  const token = await signJwt(
    {
      subjectId: callerId,
      type: "access",
      lifetimeInSeconds: 60,
    },
    "catalogue-route-test",
  );
  return app.request(
    `/api/rbac/subjects/${props.routeSubjectId ?? callerId}/ecommerce-module/catalogue-mutations`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          entity: "stores",
          method: "POST",
          data: { title: { en: "My store" } },
        },
      }),
    },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  permission.mockResolvedValue({ ok: true });
  authenticationMe.mockResolvedValue({ id: subjectId, authenticated: true });
});

test("the normal permission gate rejects before catalogue ownership or mutation runs", async () => {
  permission.mockRejectedValueOnce(
    new Error("Permission error. Route permission missing"),
  );
  expect((await request()).status).toBe(403);
  expect(authenticationMe).not.toHaveBeenCalled();
  expect(mutation).not.toHaveBeenCalled();
});

test("a permitted request must still match the Subject and have a signed-in identity", async () => {
  expect((await request({ routeSubjectId: randomUUID() })).status).toBe(401);
  expect(mutation).not.toHaveBeenCalled();
  authenticationMe.mockResolvedValueOnce({
    id: subjectId,
    authenticated: false,
  });
  expect((await request()).status).toBe(401);
  expect(mutation).not.toHaveBeenCalled();
});

test("a permitted signed-in caller reaches the Subject catalogue service with server-owned scope", async () => {
  expect((await request({ callerId: subjectId })).status).toBe(201);
  expect(permission).toHaveBeenCalledTimes(1);
  expect(mutation).toHaveBeenCalledWith({
    subjectId,
    data: {
      entity: "stores",
      method: "POST",
      data: { title: { en: "My store" } },
    },
  });
});
