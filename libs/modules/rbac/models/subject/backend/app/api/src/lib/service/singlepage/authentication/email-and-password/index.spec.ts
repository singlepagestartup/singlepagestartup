const mockIdentity = jest.fn();
const mockSubjectCreate = jest.fn();
const mockSubjectFind = jest.fn();
const mockLinkCreate = jest.fn();
const mockLinkFind = jest.fn();
const mockRoleCreate = jest.fn();
jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "test-secret",
  RBAC_JWT_SECRET: "test-jwt-secret",
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS: 3600,
  RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS: 7200,
}));
jest.mock("@sps/rbac/models/identity/sdk/server", () => ({
  api: { emailAndPassword: (props: any) => mockIdentity(props) },
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    create: (props: any) => mockSubjectCreate(props),
    findById: (props: any) => mockSubjectFind(props),
  },
}));
jest.mock("@sps/rbac/relations/subjects-to-identities/sdk/server", () => ({
  api: {
    create: (props: any) => mockLinkCreate(props),
    find: (props: any) => mockLinkFind(props),
  },
}));
jest.mock("@sps/rbac/models/role/sdk/server", () => ({
  api: {
    find: jest.fn(async () => [
      { id: "user-role", availableOnRegistration: true },
    ]),
  },
}));
jest.mock("@sps/rbac/relations/subjects-to-roles/sdk/server", () => ({
  api: { create: (props: any) => mockRoleCreate(props) },
}));
import { verify } from "hono/jwt";
import { Service } from "./index";
import { Service as MergeGuestCart } from "../../ecommerce/order/merge-guest-cart";

function service() {
  const local = {
    repository: {
      withSubjectLock: jest.fn(async (_scope, operation) => operation()),
    },
    findById: (props: any) => mockSubjectFind(props),
    create: (props: any) => mockSubjectCreate(props),
    identity: { emailAndPassowrd: (props: any) => mockIdentity(props) },
    subjectsToIdentities: {
      find: (props: any) => mockLinkFind(props),
      create: (props: any) => mockLinkCreate(props),
    },
    role: { find: jest.fn(async () => [{ id: "user-role" }]) },
    subjectsToRoles: { create: (props: any) => mockRoleCreate(props) },
  };
  return new Service({} as any, local as any);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockIdentity.mockResolvedValue({ id: "identity" });
  mockSubjectCreate.mockResolvedValue({
    id: "new-account",
    variant: "default",
  });
  mockSubjectFind.mockImplementation(async ({ id }) => ({
    id,
    variant: "default",
  }));
  mockLinkFind.mockImplementation(async ({ params }) =>
    params.filters.and[0].column === "subjectId"
      ? []
      : [
          {
            subjectId:
              mockLinkCreate.mock.calls[0]?.[0].data.subjectId ??
              "existing-account",
          },
        ],
  );
});

it("registers the current visitor Subject instead of creating a second Subject", async () => {
  const result = await service().execute({
    type: "registration",
    subjectId: "visitor",
    roles: [] as any,
    data: { login: "test@example.com", password: "test-password" },
  });
  expect(mockSubjectCreate).not.toHaveBeenCalled();
  expect(mockLinkCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      data: { subjectId: "visitor", identityId: "identity" },
    }),
  );
  expect(mockRoleCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      data: { subjectId: "visitor", roleId: "user-role" },
    }),
  );
  expect(
    (await verify(result.jwt, "test-jwt-secret", "HS256")).subject,
  ).toEqual(expect.objectContaining({ id: "visitor" }));
});

it("creates an account Subject when registration has no visitor session", async () => {
  await service().execute({
    type: "registration",
    roles: [] as any,
    data: { login: "test@example.com", password: "test-password" },
  });
  expect(mockSubjectCreate).toHaveBeenCalledTimes(1);
  expect(mockLinkCreate.mock.calls[0][0].data.subjectId).toBe("new-account");
});

it("rejects registration on an existing account before creating another Identity", async () => {
  mockLinkFind.mockResolvedValue([
    { subjectId: "account", identityId: "existing" },
  ]);
  await expect(
    service().execute({
      type: "registration",
      subjectId: "account",
      roles: [] as any,
      data: { login: "test@example.com", password: "test-password" },
    }),
  ).rejects.toThrow("already has an account");
  expect(mockIdentity).not.toHaveBeenCalled();
  expect(mockSubjectCreate).not.toHaveBeenCalled();
});

it("signs in to the existing account instead of using a caller's visitor Subject", async () => {
  const result = await service().execute({
    type: "authentication",
    data: { login: "test@example.com", password: "test-password" },
  });
  expect(mockSubjectCreate).not.toHaveBeenCalled();
  expect(mockLinkCreate).not.toHaveBeenCalled();
  expect(
    (await verify(result.jwt, "test-jwt-secret", "HS256")).subject,
  ).toEqual(expect.objectContaining({ id: "existing-account" }));
});

function concurrentGuestFixture() {
  const tables = {
    identities: [] as any[],
    links: [] as any[],
    roles: [] as any[],
  };
  let tail = Promise.resolve();
  let releaseIdentity!: () => void;
  let identityStarted!: () => void;
  const blocked = new Promise<void>((resolve) => {
    releaseIdentity = resolve;
  });
  const started = new Promise<void>((resolve) => {
    identityStarted = resolve;
  });
  const local: any = {
    repository: {
      withSubjectLock: (_scope: unknown, operation: () => Promise<unknown>) => {
        const result = tail.then(async () => {
          const before = structuredClone(tables);
          try {
            return await operation();
          } catch (error) {
            Object.assign(tables, before);
            throw error;
          }
        });
        tail = result.then(
          () => undefined,
          () => undefined,
        );
        return result;
      },
    },
    findById: jest.fn(async ({ id }) => ({ id, variant: "default" })),
    identity: {
      emailAndPassowrd: jest.fn(async ({ data }, context) => {
        expect(context).toEqual({ local: true });
        identityStarted();
        await blocked;
        const identity = { id: data.login };
        tables.identities.push(identity);
        return identity;
      }),
    },
    subjectsToIdentities: {
      find: jest.fn(async () => tables.links),
      create: jest.fn(async ({ data }) => {
        tables.links.push(data);
        return data;
      }),
    },
    role: { find: jest.fn(async () => [{ id: "user-role" }]) },
    subjectsToRoles: {
      create: jest.fn(async ({ data }) => {
        tables.roles.push(data);
        return data;
      }),
    },
    subjectsToSocialModuleProfiles: { find: jest.fn(async () => []) },
  };
  const registration = new Service({} as any, local);
  const register = (login: string) =>
    registration.execute({
      type: "registration",
      subjectId: "guest",
      roles: [] as any,
      data: { login, password: "secret" },
    });
  return { local, tables, register, started, releaseIdentity };
}

it("serializes simultaneous guest registrations before creating either identity", async () => {
  const f = concurrentGuestFixture();
  const first = f.register("first@example.invalid");
  await f.started;
  const second = f.register("second@example.invalid");
  const results = Promise.allSettled([first, second]);
  f.releaseIdentity();
  const outcomes = await results;
  expect(outcomes.map((result) => result.status)).toEqual([
    "fulfilled",
    "rejected",
  ]);
  expect(f.local.identity.emailAndPassowrd).toHaveBeenCalledTimes(1);
  expect(f.tables.links).toEqual([
    { subjectId: "guest", identityId: "first@example.invalid" },
  ]);
});

it("makes a waiting cart merge observe the completed account registration", async () => {
  const foit = jest
    .spyOn(globalThis, "fetch")
    .mockRejectedValue(new Error("No self-HTTP inside registration"));
  try {
    const f = concurrentGuestFixture();
    const registration = f.register("account@example.invalid");
    await f.started;
    const merge = new MergeGuestCart(f.local).execute({
      sourceSubjectId: "guest",
      subjectId: "existing",
    });
    const results = Promise.allSettled([registration, merge]);
    f.releaseIdentity();
    const outcomes = await results;
    expect(outcomes[0].status).toBe("fulfilled");
    expect(outcomes[1]).toEqual(
      expect.objectContaining({
        status: "rejected",
        reason: expect.objectContaining({
          message: expect.stringContaining(
            "Only an authenticated guest session",
          ),
        }),
      }),
    );
    expect(f.local.subjectsToSocialModuleProfiles.find).not.toHaveBeenCalled();
    expect(foit).not.toHaveBeenCalled();
  } finally {
    foit.mockRestore();
  }
});

it("rolls back the identity and account link if registration role attachment fails", async () => {
  const f = concurrentGuestFixture();
  f.local.subjectsToRoles.create.mockRejectedValue(new Error("role failure"));
  const registration = f.register("account@example.invalid");
  f.releaseIdentity();
  await expect(registration).rejects.toThrow("role failure");
  expect(f.tables).toEqual({ identities: [], links: [], roles: [] });
});
