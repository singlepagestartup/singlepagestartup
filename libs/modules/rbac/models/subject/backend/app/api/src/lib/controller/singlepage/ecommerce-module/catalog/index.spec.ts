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
import { offerCreate } from "@sps/rbac/models/subject/sdk/server/src/lib/singlepage/ecommerce-module/catalog";
import { route } from "@sps/rbac/models/subject/sdk/model";

const subjectId = randomUUID();
const mutation = jest.fn().mockResolvedValue({ id: randomUUID() });
const authenticationMe = jest.fn();
const createOffer = jest.fn();
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
  storeProducts: { createOffer },
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

test("the SDK sends a legacy JSON offer and a multipart offer with ordered images to the same authenticated route", async () => {
  const app = new Hono();
  app.post(`${route}/:id/ecommerce-module/offers`, (c) =>
    new Handler(service, "offer").execute(c),
  );
  const token = await signJwt(
    { subjectId, type: "access", lifetimeInSeconds: 60 },
    "catalogue-route-test",
  );
  const fetch = jest
    .spyOn(globalThis, "fetch")
    .mockImplementation((input, init) =>
      Promise.resolve(app.request(String(input), init)),
    );
  const data = {
    storeId: randomUUID(),
    product: {
      title: { en: "Desk" },
      kind: "physical",
      formula: "unit_price * quantity",
    },
    prices: [{ currencyId: randomUUID(), amount: "10" }],
  };
  const props = {
    id: subjectId,
    host: "http://localhost",
    data,
    options: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  };
  const result = { product: { id: randomUUID() }, offer: { id: randomUUID() } };
  createOffer.mockResolvedValue(result);
  try {
    await expect(offerCreate(props)).resolves.toEqual(result);
    expect(createOffer).toHaveBeenLastCalledWith(
      subjectId,
      expect.objectContaining({
        ...data,
        product: expect.objectContaining(data.product),
      }),
      [],
    );
    const selected = {
      ...data,
      categoryIds: [randomUUID()],
      attributeIds: [randomUUID()],
    };
    const images = [
      new File(["front"], "front.png"),
      new File(["side"], "side.png"),
    ];
    await expect(
      offerCreate({ ...props, data: selected, images }),
    ).resolves.toEqual(result);
    const [actor, received, uploaded] = createOffer.mock.lastCall!;
    expect(actor).toBe(subjectId);
    expect(received).toMatchObject(selected);
    expect(uploaded.map((file: File) => file.name)).toEqual([
      "front.png",
      "side.png",
    ]);
    expect(
      await Promise.all(uploaded.map((file: File) => file.text())),
    ).toEqual(["front", "side"]);
  } finally {
    fetch.mockRestore();
  }
});
