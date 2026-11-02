/**
 * BDD Suite: identity read responses.
 *
 * Given: an identity row holding a password hash, a salt and a reset code.
 * When: the row is returned through the REST find and find-by-id handlers.
 * Then: unprivileged responses omit the secret columns and privileged responses keep them.
 */

import { RBAC_PRIVILEGED_CONTEXT_KEY } from "@sps/shared-utils";
import { Configuration } from "../../configuration";
import { Controller } from ".";

const identity = {
  id: "4858dd96-7a78-4282-8135-fc3be88442f0",
  createdAt: new Date("2026-05-10T00:46:04.443Z"),
  updatedAt: new Date("2026-05-10T00:46:04.443Z"),
  variant: "default",
  provider: "email_and_password",
  account: null,
  email: "operator@example.com",
  password: "bcrypt-hash",
  salt: "bcrypt-salt",
  code: "reset-code",
};

const publicIdentity = {
  id: identity.id,
  createdAt: identity.createdAt,
  updatedAt: identity.updatedAt,
  variant: identity.variant,
  provider: identity.provider,
  account: identity.account,
  email: identity.email,
};

function createController() {
  const service = {
    find: jest.fn().mockResolvedValue([identity]),
    findById: jest.fn().mockResolvedValue(identity),
    create: jest.fn().mockResolvedValue(identity),
    update: jest.fn().mockResolvedValue(identity),
    repository: { configuration: new Configuration().getConfiguration() },
  } as any;

  return { controller: new Controller(service), service };
}

function createContext(props?: { privileged?: boolean; body?: unknown }) {
  return {
    var: { parsedQuery: {} },
    req: {
      param: jest.fn().mockReturnValue(identity.id),
      parseBody: jest
        .fn()
        .mockResolvedValue({ data: JSON.stringify(props?.body ?? {}) }),
    },
    get: jest.fn((key: string) => {
      return key === RBAC_PRIVILEGED_CONTEXT_KEY
        ? Boolean(props?.privileged)
        : undefined;
    }),
    json: jest.fn((payload) => {
      return new Response(JSON.stringify(payload));
    }),
  } as any;
}

describe("Given: an identity row holding credentials", () => {
  /**
   * BDD Scenario
   * Given: an ordinary caller reads the identity collection.
   * When: the find handler answers.
   * Then: the password hash, the salt and the reset code are absent and every other column is kept.
   */
  it("When: the collection is read Then: omits the secret columns", async () => {
    const { controller } = createController();
    const context = createContext();

    await controller.find(context, jest.fn() as any);

    expect(context.json).toHaveBeenCalledWith({ data: [publicIdentity] });
  });

  /**
   * BDD Scenario
   * Given: an ordinary caller reads one identity by id.
   * When: the find-by-id handler answers.
   * Then: the same columns are omitted.
   */
  it("When: one identity is read Then: omits the secret columns", async () => {
    const { controller } = createController();
    const context = createContext();

    await controller.findById(context, jest.fn() as any);

    expect(context.json).toHaveBeenCalledWith({ data: publicIdentity });
  });

  /**
   * BDD Scenario
   * Given: a request carrying the operator secret key.
   * When: the find handler answers.
   * Then: the full row is returned, because login and account linking read it back.
   */
  it("When: the caller is privileged Then: keeps the secret columns", async () => {
    const { controller } = createController();
    const context = createContext({ privileged: true });

    await controller.find(context, jest.fn() as any);

    expect(context.json).toHaveBeenCalledWith({ data: [identity] });
  });

  /**
   * BDD Scenario
   * Given: an ordinary caller creates or updates an identity.
   * When: the create and update handlers answer.
   * Then: their responses are filtered exactly like a read.
   */
  it("When: an identity is written Then: filters the write response too", async () => {
    const { controller } = createController();
    const createContextInstance = createContext({
      body: { email: identity.email },
    });
    const updateContextInstance = createContext({
      body: { email: identity.email },
    });

    await controller.create(createContextInstance, jest.fn() as any);
    await controller.update(updateContextInstance, jest.fn() as any);

    expect(createContextInstance.json).toHaveBeenCalledWith(
      { data: publicIdentity },
      201,
    );
    expect(updateContextInstance.json).toHaveBeenCalledWith({
      data: publicIdentity,
    });
  });
});
