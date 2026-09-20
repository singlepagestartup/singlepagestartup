/**
 * BDD Suite: wallet identity linking uses the shared verifier.
 *
 * Given: an authenticated subject links a wallet address to their own account.
 * When: the identity-create handler runs.
 * Then: verification goes through the shared service method, and no timestamp check remains in the controller.
 */

const mockIdentityCreate = jest.fn();
const mockSubjectsToIdentitiesCreate = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "test-rbac-secret",
}));

jest.mock("@sps/rbac/models/identity/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockIdentityCreate(...args),
  },
}));

jest.mock("@sps/rbac/relations/subjects-to-identities/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockSubjectsToIdentitiesCreate(...args),
  },
}));

import { Handler } from "./create";

const SUBJECT_ID = "11111111-1111-1111-1111-111111111111";
const ADDRESS = "0xAbC0000000000000000000000000000000000001";

function createContext(data: unknown) {
  return {
    req: {
      param: (name: string) => (name === "uuid" ? SUBJECT_ID : undefined),
      parseBody: async () => ({ data: JSON.stringify(data) }),
    },
    json: jest.fn((body: unknown, status?: number) => ({ body, status })),
  } as any;
}

function createService(overrides?: {
  verify?: jest.Mock;
  identities?: unknown[];
}) {
  return {
    authenticationEthereumVirtualMachineVerify:
      overrides?.verify ||
      jest.fn().mockResolvedValue({
        address: ADDRESS.toLowerCase(),
        nonce: "0123456789abcdef0123456789abcdef",
        legacy: false,
      }),
    identity: {
      find: jest.fn().mockResolvedValue(overrides?.identities || []),
    },
    findById: jest.fn().mockResolvedValue({ id: SUBJECT_ID }),
  } as any;
}

async function executeAndCatch(handler: Handler, context: any) {
  try {
    await handler.execute(context, undefined);
  } catch (error: any) {
    return error;
  }

  return undefined;
}

describe("Given: an authenticated subject links a wallet to their account", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIdentityCreate.mockResolvedValue({ id: "identity-id" });
    mockSubjectsToIdentitiesCreate.mockResolvedValue({ id: "relation-id" });
  });

  /**
   * BDD Scenario: one verification path for both flows.
   *
   * Given: a wallet link request carrying an EIP-4361 message.
   * When: the handler runs.
   * Then: it calls the shared verifier with the link purpose and links the
   * address the verifier returned.
   */
  it("delegates verification to the service", async () => {
    const service = createService();
    const handler = new Handler(service);

    const response = await handler.execute(
      createContext({
        provider: "ethereum-virtual-machine",
        message:
          "host.example wants you to sign in with your Ethereum account:",
        signature: "0xsignature",
        address: ADDRESS,
      }),
      undefined,
    );

    expect(
      service.authenticationEthereumVirtualMachineVerify,
    ).toHaveBeenCalledWith({
      data: {
        message:
          "host.example wants you to sign in with your Ethereum account:",
        signature: "0xsignature",
        address: ADDRESS,
      },
      purpose: "link",
    });
    expect(mockIdentityCreate.mock.calls[0][0].data.account).toBe(
      ADDRESS.toLowerCase(),
    );
    expect(mockSubjectsToIdentitiesCreate.mock.calls[0][0].data.subjectId).toBe(
      SUBJECT_ID,
    );
    expect((response as any).status).toBe(201);
  });

  /**
   * BDD Scenario: a challenge that was already redeemed.
   *
   * Given: the verifier refuses the nonce.
   * When: the handler runs.
   * Then: nothing is linked, with the same status the OAuth exchange answers
   * a spent code with.
   */
  it("refuses a link purpose nonce that was already consumed", async () => {
    const verify = jest
      .fn()
      .mockRejectedValue(
        new Error("Authentication error. Challenge is used or expired"),
      );
    const handler = new Handler(createService({ verify }));

    const error = await executeAndCatch(
      handler,
      createContext({
        provider: "ethereum-virtual-machine",
        message: "message",
        signature: "0xsignature",
        address: ADDRESS,
      }),
    );

    expect(error?.status).toBe(403);
    expect(mockIdentityCreate).not.toHaveBeenCalled();
    expect(mockSubjectsToIdentitiesCreate).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: a body with no provider.
   *
   * Given: the provider is missing, which used to be dereferenced before it
   * was checked.
   * When: the handler runs.
   * Then: it answers a validation error rather than an internal one.
   */
  it("answers 400 when the body carries no provider", async () => {
    const service = createService();
    const handler = new Handler(service);

    const error = await executeAndCatch(
      handler,
      createContext({ message: "message", signature: "0xsignature" }),
    );

    expect(error?.status).toBe(400);
    expect(error?.message).toContain("No provider provided");
    expect(
      service.authenticationEthereumVirtualMachineVerify,
    ).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: a wallet that already belongs to somebody.
   *
   * Given: an identity already exists for the verified address.
   * When: the handler runs.
   * Then: the link is refused.
   */
  it("refuses when the address already has an identity", async () => {
    const handler = new Handler(
      createService({ identities: [{ id: "existing-identity" }] }),
    );

    const error = await executeAndCatch(
      handler,
      createContext({
        provider: "ethereum-virtual-machine",
        message: "message",
        signature: "0xsignature",
        address: ADDRESS,
      }),
    );

    expect(error?.status).toBe(400);
    expect(error?.message).toContain("Account already exists");
    expect(mockIdentityCreate).not.toHaveBeenCalled();
  });
});
