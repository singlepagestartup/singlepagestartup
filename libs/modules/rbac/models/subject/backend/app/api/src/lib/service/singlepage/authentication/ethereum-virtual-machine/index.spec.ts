/**
 * BDD Suite: wallet login issues nothing before the challenge is claimed.
 *
 * Given: the login service verifies a wallet signature through the shared verifier.
 * When: a login is attempted.
 * Then: no identity, subject, role or token exists unless verification succeeded first.
 */

const mockIdentityFind = jest.fn();
const mockIdentityCreate = jest.fn();
const mockSubjectCreate = jest.fn();
const mockSubjectFindById = jest.fn();
const mockSubjectsToIdentitiesFind = jest.fn();
const mockSubjectsToIdentitiesCreate = jest.fn();
const mockRoleFind = jest.fn();
const mockSubjectsToRolesCreate = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  NEXT_PUBLIC_HOST_SERVICE_URL: "https://host.example",
  RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS: 86400,
  RBAC_JWT_SECRET: "test-jwt-secret",
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS: 3600,
  RBAC_SECRET_KEY: "test-rbac-secret",
}));

jest.mock("@sps/rbac/models/identity/sdk/server", () => ({
  api: {
    find: (...args: unknown[]) => mockIdentityFind(...args),
    create: (...args: unknown[]) => mockIdentityCreate(...args),
  },
}));

jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockSubjectCreate(...args),
    findById: (...args: unknown[]) => mockSubjectFindById(...args),
  },
}));

jest.mock("@sps/rbac/relations/subjects-to-identities/sdk/server", () => ({
  api: {
    find: (...args: unknown[]) => mockSubjectsToIdentitiesFind(...args),
    create: (...args: unknown[]) => mockSubjectsToIdentitiesCreate(...args),
  },
}));

jest.mock("@sps/rbac/models/role/sdk/server", () => ({
  api: {
    find: (...args: unknown[]) => mockRoleFind(...args),
  },
}));

jest.mock("@sps/rbac/relations/subjects-to-roles/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockSubjectsToRolesCreate(...args),
  },
}));

import { Service } from ".";

const ADDRESS = "0xAbC0000000000000000000000000000000000001";
const SUBJECT_ID = "11111111-1111-1111-1111-111111111111";

function createService(verify: jest.Mock) {
  return new Service({} as any, { verify: verify as any });
}

function execute(service: Service) {
  return service.execute({
    data: {
      message: "message",
      signature: "0xsignature" as any,
      address: ADDRESS as any,
    },
  });
}

describe("Given: a wallet asks for a session", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIdentityFind.mockResolvedValue([
      { id: "identity-id", account: ADDRESS.toLowerCase() },
    ]);
    mockSubjectsToIdentitiesFind.mockResolvedValue([
      { id: "relation-id", subjectId: SUBJECT_ID },
    ]);
    mockSubjectFindById.mockResolvedValue({ id: SUBJECT_ID });
  });

  /**
   * BDD Scenario: nothing is issued on a refused challenge.
   *
   * Given: verification refuses the message.
   * When: the login runs.
   * Then: no identity, subject or role is written and no token comes back.
   */
  it("issues nothing when the challenge is not accepted", async () => {
    const verify = jest
      .fn()
      .mockRejectedValue(
        new Error("Authentication error. Challenge is used or expired"),
      );

    await expect(execute(createService(verify))).rejects.toThrow(
      "Challenge is used or expired",
    );

    expect(mockIdentityFind).not.toHaveBeenCalled();
    expect(mockIdentityCreate).not.toHaveBeenCalled();
    expect(mockSubjectCreate).not.toHaveBeenCalled();
    expect(mockSubjectsToRolesCreate).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: the challenge is claimed for the login purpose.
   *
   * Given: a login attempt.
   * When: the service verifies it.
   * Then: it asks for the authentication purpose, not the linking one.
   */
  it("verifies the message for the authentication purpose", async () => {
    const verify = jest.fn().mockResolvedValue({
      address: ADDRESS.toLowerCase(),
      nonce: "0123456789abcdef0123456789abcdef",
      legacy: false,
    });

    await execute(createService(verify));

    expect(verify).toHaveBeenCalledWith({
      data: {
        message: "message",
        signature: "0xsignature",
        address: ADDRESS,
      },
      purpose: "authentication",
    });
  });

  /**
   * BDD Scenario: the successful login.
   *
   * Given: verification succeeded and the address already has a subject.
   * When: the login runs.
   * Then: a token pair is returned for that subject.
   */
  it("returns a token pair for the subject behind the verified address", async () => {
    const verify = jest.fn().mockResolvedValue({
      address: ADDRESS.toLowerCase(),
      nonce: "0123456789abcdef0123456789abcdef",
      legacy: false,
    });

    const result = await execute(createService(verify));

    expect(typeof result.jwt).toBe("string");
    expect(typeof result.refresh).toBe("string");
    expect(mockIdentityCreate).not.toHaveBeenCalled();
  });
});
