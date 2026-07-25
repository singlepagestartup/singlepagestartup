/**
 * BDD Suite: subject deanonymization by checkout email.
 *
 * Given: checkout turns an anonymous subject into a contactable subject.
 * When: the email is already used by another subject or by the current one.
 * Then: contact identities remain subject-scoped and are reused only locally.
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

import { Service } from "./deanonymize";

describe("Given: a checkout email belongs to a subject", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIdentityCreate.mockResolvedValue({
      id: "identity-created",
      email: "same@example.com",
      provider: "email",
    });
    mockSubjectsToIdentitiesCreate.mockResolvedValue({
      id: "subject-identity-created",
    });
  });

  /**
   * BDD Scenario: another subject already uses the same checkout email.
   *
   * Given: the current subject has no identity links.
   * When: deanonymization receives an email used elsewhere.
   * Then: a new plain-email identity is created for the current subject
   * without a global find-or-create lookup.
   */
  it("When: subject has no identities Then: creates a subject-scoped contact identity", async () => {
    const identity = {
      find: jest.fn(),
    } as any;
    const subjectsToIdentities = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
    const service = new Service({
      findById: jest.fn().mockResolvedValue({ id: "subject-current" }),
      identity,
      subjectsToIdentities,
    });

    await service.execute({
      id: "subject-current",
      email: "same@example.com",
    });

    expect(identity.find).not.toHaveBeenCalled();
    expect(mockIdentityCreate).toHaveBeenCalledWith({
      data: {
        email: "same@example.com",
        provider: "email",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      },
    });
    expect(mockSubjectsToIdentitiesCreate).toHaveBeenCalledWith({
      data: {
        subjectId: "subject-current",
        identityId: "identity-created",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      },
    });
  });

  /**
   * BDD Scenario: current subject already owns the checkout email.
   *
   * Given: the subject has a linked identity with the requested email.
   * When: deanonymization runs again.
   * Then: no duplicate identity or relation is created.
   */
  it("When: subject already owns the email Then: reuses the linked identity", async () => {
    const identity = {
      find: jest.fn().mockResolvedValue([
        {
          id: "identity-existing",
          email: "same@example.com",
          provider: "email",
        },
      ]),
    } as any;
    const subjectsToIdentities = {
      find: jest.fn().mockResolvedValue([
        {
          id: "subject-identity-existing",
          subjectId: "subject-current",
          identityId: "identity-existing",
        },
      ]),
    } as any;
    const service = new Service({
      findById: jest.fn().mockResolvedValue({ id: "subject-current" }),
      identity,
      subjectsToIdentities,
    });

    await service.execute({
      id: "subject-current",
      email: "same@example.com",
    });

    expect(identity.find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: ["identity-existing"],
            },
            {
              column: "email",
              method: "eq",
              value: "same@example.com",
            },
          ],
        },
      },
    });
    expect(mockIdentityCreate).not.toHaveBeenCalled();
    expect(mockSubjectsToIdentitiesCreate).not.toHaveBeenCalled();
  });
});
