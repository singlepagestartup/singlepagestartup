import { Hono } from "hono";
import { verify } from "hono/jwt";
import { Handler } from "./update";
import { Middleware as RequestSubjectOwnsIdentity } from "../../../../../../middlewares/src/lib/request-subject-owns-identity";

jest.mock("@sps/shared-utils", () => ({ RBAC_JWT_SECRET: "test-jwt" }));
jest.mock("hono/jwt", () => ({
  verify: jest.fn(async () => ({ subject: { id: "owner" } })),
}));
jest.mock("@sps/backend-utils", () => ({
  authorization: (c: any) => c.req.header("Authorization"),
  getHttpErrorType: (error: Error) => ({
    status: 400,
    message: error.message,
    details: {},
  }),
}));
jest.mock("@sps/shared-backend-api", () => ({
  applyOutputSchema: ({ data }: any) => {
    const { password, salt, resetPasswordCode, ...safe } = data;
    return safe;
  },
}));

const passwordBody = {
  password: "current-password",
  newPassword: "next-password",
};
function fixture(
  data: Record<string, unknown> = passwordBody,
  links = [{ subjectId: "owner", identityId: "identity" }],
) {
  const identity = {
    id: "identity",
    provider: "email_and_password",
    email: "old@example.com",
    password: "hash",
    salt: "salt",
    resetPasswordCode: "code",
  };
  const service = {
    subjectsToIdentities: {
      find: jest.fn(async ({ params }: any) =>
        links.filter((link) =>
          params.filters.and.every(
            (filter: any) =>
              link[filter.column as keyof typeof link] === filter.value,
          ),
        ),
      ),
    },
    identity: {
      findById: jest.fn(async () => identity),
      changePassword: jest.fn(async () =>
        Object.assign(identity, { password: "new-hash" }),
      ),
    },
  };
  const app = new Hono();
  app.patch(
    "/:uuid/identities/:identityUuid",
    new RequestSubjectOwnsIdentity(service).init(),
    (c) => new Handler(service as any).execute(c, undefined),
  );
  const request = (
    subjectId = "owner",
    identityId = "identity",
    headers: Record<string, string> = { Authorization: "test-token" },
  ) => {
    const body = new FormData();
    body.set("data", JSON.stringify(data));
    return app.request(`/${subjectId}/identities/${identityId}`, {
      method: "PATCH",
      body,
      headers,
    });
  };
  return { request, service, identity };
}
beforeEach(() => jest.clearAllMocks());

it("changes the owned Identity through its service and returns only safe output", async () => {
  const { request, service } = fixture();
  const res = await request();
  expect(res.status).toBe(201);
  expect(service.identity.changePassword).toHaveBeenCalledWith({
    id: "identity",
    data: passwordBody,
  });
  expect(await res.json()).toEqual({
    data: {
      id: "identity",
      provider: "email_and_password",
      email: "old@example.com",
    },
  });
  expect(service.subjectsToIdentities.find).toHaveBeenCalledWith({
    params: {
      filters: {
        and: [
          { column: "subjectId", method: "eq", value: "owner" },
          { column: "identityId", method: "eq", value: "identity" },
        ],
      },
    },
  });
});

it.each([
  [
    "another Subject",
    "foreign",
    "identity",
    [{ subjectId: "owner", identityId: "identity" }],
  ],
  [
    "another Identity",
    "owner",
    "foreign",
    [{ subjectId: "foreign", identityId: "foreign" }],
  ],
  ["missing relation", "owner", "identity", []],
  [
    "ambiguous relation",
    "owner",
    "identity",
    [
      { subjectId: "owner", identityId: "identity" },
      { subjectId: "owner", identityId: "identity" },
    ],
  ],
] as const)(
  "rejects %s with a valid password body before credential access",
  async (_label, subjectId, identityId, links) => {
    const { request, service } = fixture(passwordBody, [...links]);
    expect((await request(subjectId, identityId)).status).toBe(400);
    expect(service.identity.findById).not.toHaveBeenCalled();
    expect(service.identity.changePassword).not.toHaveBeenCalled();
  },
);

it("requires the effective user JWT even when a privileged secret is supplied", async () => {
  const { request, service } = fixture();
  expect(
    (await request("owner", "identity", { "X-RBAC-SECRET-KEY": "test-key" }))
      .status,
  ).toBe(400);
  expect(verify).not.toHaveBeenCalled();
  expect(service.identity.changePassword).not.toHaveBeenCalled();
});

it("preserves invalid-current-password errors without returning or mutating credentials", async () => {
  const { request, service } = fixture();
  service.identity.changePassword.mockRejectedValue(
    new Error("Validation error. Invalid credentials"),
  );
  const response = await request();
  expect(response.status).toBe(400);
  expect(await response.text()).toBe("Validation error. Invalid credentials");
});

it.each([
  { provider: "admin" },
  { email: "new@example.com" },
  { newPassword: "next-password" },
  { password: "current-password", newPassword: "short" },
])(
  "rejects unsupported account patches before changing credentials: %j",
  async (data) => {
    const { request, service } = fixture(data);
    expect((await request()).status).toBe(400);
    expect(service.identity.changePassword).not.toHaveBeenCalled();
  },
);

it("rejects credentials managed by an external provider", async () => {
  const { request, service, identity } = fixture();
  identity.provider = "oauth_google";
  expect((await request()).status).toBe(400);
  expect(service.identity.changePassword).not.toHaveBeenCalled();
});
