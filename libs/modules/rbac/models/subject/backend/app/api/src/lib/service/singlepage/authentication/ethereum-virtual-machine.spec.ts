const mockVerifyMessage = jest.fn();
const mockIdentityFind = jest.fn();
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "test-secret",
  RBAC_JWT_SECRET: "test-jwt-secret",
}));
jest.mock("viem", () => ({
  ...jest.requireActual("viem"),
  createPublicClient: () => ({ verifyMessage: mockVerifyMessage }),
  http: jest.fn(),
}));
jest.mock("@sps/rbac/models/identity/sdk/server", () => ({
  api: { find: (...args: unknown[]) => mockIdentityFind(...args) },
}));
import { signJwt } from "@sps/backend-utils";
import { verify } from "hono/jwt";
import { Service } from "./ethereum-virtual-machine";

beforeEach(() => {
  jest.clearAllMocks();
  mockVerifyMessage.mockResolvedValue(true);
  mockIdentityFind.mockResolvedValue([]);
});

async function fixture() {
  let locked = false;
  const local: any = {
    repository: {
      withSubjectLock: jest.fn(async (_scope, operation) => {
        locked = true;
        try {
          return await operation();
        } finally {
          locked = false;
        }
      }),
    },
    findById: jest.fn(async () => ({ id: "guest", variant: "default" })),
    create: jest.fn(),
    identity: {
      create: jest.fn(async ({ data }) => {
        expect(locked).toBe(true);
        return { id: "wallet", ...data };
      }),
    },
    subjectsToIdentities: {
      find: jest.fn(async () => []),
      create: jest.fn(async ({ data }) => {
        expect(locked).toBe(true);
        return data;
      }),
    },
    role: { find: jest.fn(async () => [{ id: "user-role" }]) },
    subjectsToRoles: {
      create: jest.fn(async () => {
        expect(locked).toBe(true);
      }),
    },
  };
  const token = await signJwt(
    { subjectId: "guest", type: "access", lifetimeInSeconds: 3600 },
    "test-jwt-secret",
  );
  const props = {
    data: {
      message: String(Date.now()),
      signature: "0xsigned" as any,
      address: "0x1234000000000000000000000000000000000000" as any,
      guestSessionToken: token,
    },
  };
  return { local, props, service: new Service({} as any, local) };
}

it("attaches a proven wallet to the guest under the same subject lock as cart handoff", async () => {
  const { service, local, props } = await fixture();
  const result = await service.execute(props);
  expect(mockVerifyMessage).toHaveBeenCalledWith({
    message: props.data.message,
    signature: props.data.signature,
    address: props.data.address,
  });
  expect(local.repository.withSubjectLock).toHaveBeenCalledWith(
    { subjectId: "guest" },
    expect.any(Function),
  );
  expect(local.subjectsToIdentities.create).toHaveBeenCalledWith({
    data: { subjectId: "guest", identityId: "wallet" },
  });
  expect(local.create).not.toHaveBeenCalled();
  expect(
    (await verify(result.jwt, "test-jwt-secret", "HS256")).subject,
  ).toEqual(expect.objectContaining({ id: "guest" }));
});

it("rechecks guest registration after acquiring the subject lock", async () => {
  const { service, local, props } = await fixture();
  local.subjectsToIdentities.find
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ identityId: "concurrent-registration" }]);
  await expect(service.execute(props)).rejects.toThrow(
    "already has an account",
  );
  expect(local.identity.create).not.toHaveBeenCalled();
  expect(local.subjectsToIdentities.create).not.toHaveBeenCalled();
});

it("rejects an invalid wallet proof before looking up or attaching an identity", async () => {
  const { service, local, props } = await fixture();
  mockVerifyMessage.mockResolvedValue(false);
  await expect(service.execute(props)).rejects.toThrow("Invalid signature");
  expect(mockIdentityFind).not.toHaveBeenCalled();
  expect(local.repository.withSubjectLock).not.toHaveBeenCalled();
});
