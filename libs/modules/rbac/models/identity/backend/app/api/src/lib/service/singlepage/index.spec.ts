/**
 * BDD Suite: password registration and sign-in against stored identities.
 *
 * Given: identities stored with the providers that created them.
 * When: a password registration or a password sign-in arrives for an address.
 * Then: registration is refused when a provider that proves the address
 *       already holds it, and proceeds otherwise, storing a bcrypt hash (issue
 *       #280 interim guard); sign-in answers an unknown address, an identity
 *       without a salt and a wrong password with one error after one bcrypt
 *       round each, and returns the identity for the right password (issue
 *       #310).
 */

import bcrypt from "bcrypt";

const OPERATOR_SECRET = "operator-secret";

type IFilter = { column: string; method: string; value: unknown };
type IRow = Record<string, string>;

let mockRows: IRow[] = [];

const mockFind = jest.fn(
  async (props: { params: { filters: { and: IFilter[] } } }) => {
    return mockRows.filter((row) =>
      props.params.filters.and.every((filter) => {
        if (filter.method === "eq") {
          return row[filter.column] === filter.value;
        }

        if (filter.method === "inArray") {
          return (filter.value as unknown[]).includes(row[filter.column]);
        }

        throw new Error(`Unexpected filter method: ${filter.method}`);
      }),
    );
  },
);

const mockCreate = jest.fn(async (props: { data: IRow }) => {
  return { id: "identity-new", ...props.data };
});

const mockUpdate = jest.fn(async (props: { id: string; data: IRow }) => {
  return { ...props.data, id: props.id };
});

jest.mock("@sps/rbac/models/identity/sdk/server", () => {
  return {
    api: {
      find: (props: any) => mockFind(props),
      create: (props: any) => mockCreate(props),
      update: (props: any) => mockUpdate(props),
    },
  };
});

jest.mock("@sps/shared-utils", () => {
  return {
    ...jest.requireActual("@sps/shared-utils"),
    RBAC_SECRET_KEY: "operator-secret",
    RBAC_JWT_SECRET: "jwt-secret",
  };
});

jest.mock("@sps/shared-backend-api", () => {
  return {
    CRUDService: class {
      constructor(public repository?: unknown) {}
    },
  };
});

import { Service } from ".";

function register(login: string, password = "correct horse battery") {
  return new Service({} as any).emailAndPassowrd({
    data: { type: "registration", login, password },
  });
}

describe("Given: a password registration for an address", () => {
  beforeEach(() => {
    mockRows = [];
    mockFind.mockClear();
    mockCreate.mockClear();
  });

  /**
   * BDD Scenario
   * Given: a Google identity already holds the address.
   * When: a password registration arrives for it in another letter case.
   * Then: it is refused before any identity is created, and the lookup that
   *       refuses it carries the operator secret, because anonymous callers
   *       cannot read identities.
   */
  it("refuses the address a Google identity already holds", async () => {
    mockRows = [
      {
        id: "identity-google",
        email: "owner@example.com",
        provider: "oauth_google",
      },
    ];

    await expect(register("Owner@Example.com")).rejects.toThrow(
      "already used to sign in with another method",
    );

    expect(mockCreate).not.toHaveBeenCalled();

    const guardLookup = mockFind.mock.calls
      .map(([props]) => props as any)
      .find((props) =>
        props.params.filters.and.some(
          (filter: IFilter) => filter.method === "inArray",
        ),
      );

    expect(guardLookup?.options?.headers?.["X-RBAC-SECRET-KEY"]).toBe(
      OPERATOR_SECRET,
    );
  });

  /**
   * BDD Scenario
   * Given: only a Telegram identity carries the address.
   * When: a password registration arrives for it.
   * Then: it proceeds, because Telegram carries an address without proving it,
   *       and the stored password is a bcrypt hash of the one submitted.
   */
  it("registers an address that only a Telegram identity carries", async () => {
    mockRows = [
      {
        id: "identity-telegram",
        email: "owner@example.com",
        provider: "telegram",
      },
    ];

    const identity = await register("owner@example.com");

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(identity).toMatchObject({
      email: "owner@example.com",
      provider: "email_and_password",
    });
    expect(identity.password).not.toBe("correct horse battery");
    expect(
      await bcrypt.compare("correct horse battery", identity.password ?? ""),
    ).toBe(true);
  });

  /**
   * BDD Scenario
   * Given: no identity holds the address.
   * When: a password registration arrives for it.
   * Then: the identity is created with the address in lower case.
   */
  it("registers an address no identity holds", async () => {
    const identity = await register("New@Example.com");

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(identity).toMatchObject({
      email: "new@example.com",
      provider: "email_and_password",
    });
  });
});

function signIn(login: string, password: string) {
  return new Service({} as any).emailAndPassowrd({
    data: { type: "login", login, password },
  });
}

async function storeIdentity(props: { password: string; withSalt?: boolean }) {
  const salt = await bcrypt.genSalt(4);

  mockRows = [
    {
      id: "identity-owner",
      email: "owner@example.com",
      provider: "email_and_password",
      ...(props.withSalt === false ? {} : { salt }),
      password: await bcrypt.hash(props.password, salt),
    },
  ];
}

async function rejection(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return (error as Error).message;
  }

  throw new Error("The sign-in was expected to be refused");
}

describe("Given: a password sign-in for an address", () => {
  beforeEach(() => {
    mockRows = [];
    mockFind.mockClear();
    mockUpdate.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * BDD Scenario
   * Given: one password identity holds the address.
   * When: a sign-in arrives for an unknown address and another with a wrong
   *       password for the known one.
   * Then: both are refused with the same error.
   */
  it("refuses an unknown address and a wrong password with the same error", async () => {
    await storeIdentity({ password: "correct horse battery" });

    const unknown = await rejection(
      signIn("nobody@example.com", "correct horse battery"),
    );
    const wrong = await rejection(
      signIn("owner@example.com", "incorrect horse battery"),
    );

    expect(unknown).toBe("Authentication error. Invalid credentials");
    expect(wrong).toBe(unknown);
  });

  /**
   * BDD Scenario
   * Given: one password identity holds the address.
   * When: a sign-in arrives for an unknown address and another with a wrong
   *       password.
   * Then: each spends exactly one bcrypt round, so the time taken does not
   *       tell the two apart.
   */
  it("spends one bcrypt round for an unknown address as for a wrong password", async () => {
    await storeIdentity({ password: "correct horse battery" });

    const hash = jest.spyOn(bcrypt, "hash");

    await rejection(signIn("nobody@example.com", "correct horse battery"));

    expect(hash).toHaveBeenCalledTimes(1);

    await rejection(signIn("owner@example.com", "incorrect horse battery"));

    expect(hash).toHaveBeenCalledTimes(2);
  });

  /**
   * BDD Scenario
   * Given: a password identity stored without a salt.
   * When: a sign-in arrives for it.
   * Then: it is refused with the same error as an unknown address.
   */
  it("refuses an identity without a salt with the same error", async () => {
    await storeIdentity({ password: "correct horse battery", withSalt: false });

    await expect(
      signIn("owner@example.com", "correct horse battery"),
    ).rejects.toThrow("Authentication error. Invalid credentials");
  });

  /**
   * BDD Scenario
   * Given: one password identity holds the address.
   * When: a sign-in arrives with the right password in another letter case of
   *       the address.
   * Then: the identity is returned.
   */
  it("returns the identity for the right password", async () => {
    await storeIdentity({ password: "correct horse battery" });

    await expect(
      signIn("Owner@Example.com", "correct horse battery"),
    ).resolves.toMatchObject({ id: "identity-owner" });
  });
});
