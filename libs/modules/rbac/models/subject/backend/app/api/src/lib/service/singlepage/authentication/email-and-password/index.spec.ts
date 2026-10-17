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
  const result = await new Service({} as any).execute({
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
  expect((await verify(result.jwt, "test-jwt-secret")).subject).toEqual(
    expect.objectContaining({ id: "visitor" }),
  );
});

it("creates an account Subject when registration has no visitor session", async () => {
  await new Service({} as any).execute({
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
    new Service({} as any).execute({
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
  const result = await new Service({} as any).execute({
    type: "authentication",
    data: { login: "test@example.com", password: "test-password" },
  });
  expect(mockSubjectCreate).not.toHaveBeenCalled();
  expect(mockLinkCreate).not.toHaveBeenCalled();
  expect((await verify(result.jwt, "test-jwt-secret")).subject).toEqual(
    expect.objectContaining({ id: "existing-account" }),
  );
});
