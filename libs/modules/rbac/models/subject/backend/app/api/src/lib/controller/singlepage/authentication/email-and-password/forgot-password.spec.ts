/**
 * BDD Suite: forgot-password answer for known and unknown addresses.
 *
 * Given: password identities, some linked to a subject, and addresses no
 *        identity holds.
 * When: a forgot-password request arrives for each kind of address.
 * Then: every request is answered 201 with the same body, and a reset code is
 *       stored only for an address held by exactly one linked identity.
 */

const mockUpdate = jest.fn();

jest.mock("@sps/shared-utils", () => {
  return {
    ...jest.requireActual("@sps/shared-utils"),
    RBAC_SECRET_KEY: "operator-secret",
  };
});

jest.mock("@sps/rbac/models/identity/sdk/server", () => {
  return {
    api: {
      update: (props: unknown) => mockUpdate(props),
    },
  };
});

import { Handler } from "./forgot-password";

type IIdentity = { id: string; email: string; provider: string };

function createService(props: {
  identities: IIdentity[];
  linkedIdentityIds: string[];
}) {
  return {
    identity: {
      find: jest.fn(async (query: any) => {
        const email = query.params.filters.and.find(
          (filter: any) => filter.column === "email",
        )?.value;

        return props.identities.filter((identity) => identity.email === email);
      }),
    },
    subjectsToIdentities: {
      find: jest.fn(async (query: any) => {
        const identityId = query.params.filters.and.find(
          (filter: any) => filter.column === "identityId",
        )?.value;

        return props.linkedIdentityIds.includes(identityId)
          ? [{ id: "link-1", identityId, subjectId: "subject-1" }]
          : [];
      }),
    },
  };
}

function createContext(email: string) {
  return {
    req: {
      parseBody: jest.fn(async () => ({ data: JSON.stringify({ email }) })),
    },
    json: jest.fn((body: unknown, status: number) => ({ body, status })),
  } as any;
}

async function requestReset(
  service: ReturnType<typeof createService>,
  email: string,
) {
  const context = createContext(email);
  const answer = await new Handler(service as any).execute(context, jest.fn());

  return answer as unknown as { body: unknown; status: number };
}

const OWNER: IIdentity = {
  id: "identity-owner",
  email: "owner@example.com",
  provider: "email_and_password",
};

describe("Given: forgot-password requests for different addresses", () => {
  beforeEach(() => {
    mockUpdate.mockReset();
    mockUpdate.mockImplementation(async (props: any) => ({
      ...props.data,
      id: props.id,
    }));
  });

  /**
   * BDD Scenario
   * Given: an address held by one identity linked to a subject.
   * When: a forgot-password request arrives for it.
   * Then: a reset code is stored with the operator secret and the request is
   *       answered 201.
   */
  it("stores a reset code for an address one linked identity holds", async () => {
    const service = createService({
      identities: [OWNER],
      linkedIdentityIds: [OWNER.id],
    });

    const answer = await requestReset(service, OWNER.email);

    expect(answer).toEqual({ body: { data: { ok: true } }, status: 201 });
    expect(mockUpdate).toHaveBeenCalledTimes(1);

    const update = mockUpdate.mock.calls[0][0];

    expect(update.id).toBe(OWNER.id);
    expect(typeof update.data.code).toBe("string");
    expect(update.data.code).not.toContain("/");
    expect(update.options.headers["X-RBAC-SECRET-KEY"]).toBe("operator-secret");
  });

  /**
   * BDD Scenario
   * Given: addresses that no identity holds, that two identities hold, or
   *        whose identity is linked to no subject.
   * When: a forgot-password request arrives for each.
   * Then: each is answered exactly like the known address and no code is stored.
   */
  it("answers every other address exactly like a known one", async () => {
    const known = await requestReset(
      createService({ identities: [OWNER], linkedIdentityIds: [OWNER.id] }),
      OWNER.email,
    );

    mockUpdate.mockClear();

    const unknown = await requestReset(
      createService({ identities: [OWNER], linkedIdentityIds: [OWNER.id] }),
      "nobody@example.com",
    );
    const ambiguous = await requestReset(
      createService({
        identities: [OWNER, { ...OWNER, id: "identity-duplicate" }],
        linkedIdentityIds: [OWNER.id],
      }),
      OWNER.email,
    );
    const unlinked = await requestReset(
      createService({ identities: [OWNER], linkedIdentityIds: [] }),
      OWNER.email,
    );

    expect(unknown).toEqual(known);
    expect(ambiguous).toEqual(known);
    expect(unlinked).toEqual(known);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
