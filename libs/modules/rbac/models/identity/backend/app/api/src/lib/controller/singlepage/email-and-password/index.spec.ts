/**
 * BDD Suite: credential stripping on the hand-written identity handlers.
 *
 * Given: the login and change-password handlers build their own responses instead of using the shared REST handlers.
 * When: each answers with an identity row.
 * Then: the model output schema is applied, so the password hash, salt and reset code never reach the caller.
 */

import { z } from "zod";
import { RBAC_PRIVILEGED_CONTEXT_KEY } from "@sps/shared-utils";
import { Handler as EmailAndPasswordHandler } from ".";
import { Handler as ChangePasswordHandler } from "../change-password";

const identity = {
  id: "identity-1",
  email: "one@example.com",
  provider: "email_and_password",
  password: "$2b$10$HIfoJ6CyMWMSYB2u739xduuMQna45GQA8JKmX0RCM5Wkwig7OyFc6",
  salt: "$2b$10$HIfoJ6CyMWMSYB2u739xdu",
  code: "reset-code",
};

const outputSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    provider: z.string(),
  })
  .strip();

function createService(method: "emailAndPassowrd" | "changePassword") {
  return {
    [method]: jest.fn().mockResolvedValue(identity),
    repository: { configuration: { repository: { outputSchema } } },
  } as any;
}

function createContext(props?: { privileged?: boolean }) {
  return {
    req: {
      parseBody: jest
        .fn()
        .mockResolvedValue({ data: JSON.stringify({ login: "one" }) }),
      param: jest.fn().mockReturnValue("identity-1"),
    },
    get: jest.fn((key: string) =>
      key === RBAC_PRIVILEGED_CONTEXT_KEY
        ? Boolean(props?.privileged)
        : undefined,
    ),
    json: jest.fn((payload) => new Response(JSON.stringify(payload))),
  } as any;
}

describe("Given: an identity handler that builds its own response", () => {
  /**
   * BDD Scenario
   * Given: a caller logs in over the public route.
   * When: the handler answers.
   * Then: the response carries no password hash, salt or reset code.
   */
  it("When: login answers Then: strips the credential columns", async () => {
    const c = createContext();
    const handler = new EmailAndPasswordHandler(
      createService("emailAndPassowrd"),
    );

    await handler.execute(c, jest.fn());

    const [payload] = c.json.mock.calls[0];
    expect(payload.data).toEqual({
      id: "identity-1",
      email: "one@example.com",
      provider: "email_and_password",
    });
    expect(payload.data).not.toHaveProperty("password");
    expect(payload.data).not.toHaveProperty("salt");
    expect(payload.data).not.toHaveProperty("code");
  });

  /**
   * BDD Scenario
   * Given: a caller changes a password over the public route.
   * When: the handler answers.
   * Then: the response carries no credential columns either.
   */
  it("When: change-password answers Then: strips the credential columns", async () => {
    const c = createContext();
    const handler = new ChangePasswordHandler(createService("changePassword"));

    await handler.execute(c, jest.fn());

    const [payload] = c.json.mock.calls[0];
    expect(payload.data).not.toHaveProperty("password");
    expect(payload.data).not.toHaveProperty("salt");
    expect(payload.data).not.toHaveProperty("code");
  });

  /**
   * BDD Scenario
   * Given: the framework reads these routes back over loopback with the operator key.
   * When: the request is marked privileged.
   * Then: the full row is returned, so authentication keeps working.
   */
  it("When: the caller is privileged Then: returns the full row", async () => {
    const c = createContext({ privileged: true });
    const handler = new EmailAndPasswordHandler(
      createService("emailAndPassowrd"),
    );

    await handler.execute(c, jest.fn());

    const [payload] = c.json.mock.calls[0];
    expect(payload.data).toEqual(identity);
  });
});
