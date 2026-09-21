/**
 * BDD Suite: EVM login challenge issuance.
 *
 * Given: a caller asks for a wallet login challenge.
 * When: the nonce service creates the action row and builds the message.
 * Then: the row carries a fresh nonce with an explicit expiry, and the returned message contains that nonce, the allowed domain and issuedAt.
 */

const mockActionCreate = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  NEXT_PUBLIC_HOST_SERVICE_URL: "https://host.example",
  RBAC_EVM_NONCE_LIFETIME_IN_SECONDS: 120,
  RBAC_SECRET_KEY: "test-rbac-secret",
}));

jest.mock("@sps/rbac/models/action/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockActionCreate(...args),
  },
}));

import { parseSiweMessage } from "./utils";
import { Service } from "./nonce";

const ADDRESS = "0xAbC0000000000000000000000000000000000001";

function createActionId(counter: number) {
  const hex = `0123456789abcdef0123456789abcde${counter.toString(16)}`;

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

function getCreatedRow(index = 0) {
  return mockActionCreate.mock.calls[index][0].data;
}

function issue(props?: {
  purpose?: "authentication" | "link";
  address?: string;
}) {
  return new Service({} as any).execute({
    data: {
      address: props?.address ?? ADDRESS,
      purpose: props?.purpose,
    },
  });
}

describe("Given: a caller asks for a wallet login challenge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    let counter = 0;
    mockActionCreate.mockImplementation(async () => {
      counter += 1;

      return { id: createActionId(counter) };
    });
  });

  /**
   * BDD Scenario: the row bounds its own lifetime.
   *
   * Given: the configured challenge lifetime.
   * When: the challenge is issued.
   * Then: the action row is written with an explicit expiresAt, not the table default.
   */
  it("creates a row with an explicit expiresAt", async () => {
    const before = Date.now();

    const result = await issue();

    const row = getCreatedRow();
    expect(row.expiresAt).toBeInstanceOf(Date);
    expect(row.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 120 * 1000);
    expect(Date.parse(result.expiresAt)).toBe(row.expiresAt.getTime());
  });

  /**
   * BDD Scenario: the wallet signs the value the server wrote down.
   *
   * Given: a challenge is issued.
   * When: the returned message is parsed.
   * Then: it carries the nonce the caller was given.
   */
  it("returns a message containing the nonce", async () => {
    const result = await issue();

    expect(parseSiweMessage(result.message)?.nonce).toBe(result.nonce);
  });

  /**
   * BDD Scenario: the message is bound to this application.
   *
   * Given: the configured host.
   * When: the message is built.
   * Then: its domain and URI are that host, and the address is the caller's.
   */
  it("returns a message whose domain is the configured host", async () => {
    const result = await issue();

    const parsed = parseSiweMessage(result.message);
    expect(parsed?.domain).toBe("host.example");
    expect(parsed?.uri).toBe("https://host.example");
    expect(parsed?.address).toBe(ADDRESS);
  });

  /**
   * BDD Scenario: two callers never share a challenge.
   *
   * Given: two requests.
   * When: both are issued.
   * Then: the nonces differ.
   */
  it("issues a distinct nonce on each call", async () => {
    const first = await issue();
    const second = await issue();

    expect(first.nonce).not.toBe(second.nonce);
  });

  /**
   * BDD Scenario: the challenge knows what it is for.
   *
   * Given: a linking request.
   * When: the row is written.
   * Then: the purpose and the address are stored on it.
   */
  it("records the requested purpose", async () => {
    await issue({ purpose: "link" });

    expect(getCreatedRow().payload).toEqual({
      type: "evm-nonce",
      evm: {
        purpose: "link",
        address: ADDRESS.toLowerCase(),
        chainId: 1,
        consumedAt: null,
      },
    });
  });

  /**
   * BDD Scenario: a purpose the flow does not have.
   *
   * Given: an unknown purpose.
   * When: a challenge is asked for.
   * Then: it is refused before any row is written.
   */
  it("refuses an unknown purpose", async () => {
    await expect(issue({ purpose: "transfer" as any })).rejects.toThrow(
      "Invalid purpose",
    );
    expect(mockActionCreate).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: a caller with no wallet address.
   *
   * Given: a request without a well-formed address.
   * When: a challenge is asked for.
   * Then: it is refused before any row is written.
   */
  it("refuses a request without a well-formed address", async () => {
    await expect(issue({ address: "not-an-address" })).rejects.toThrow(
      "Invalid address",
    );
    expect(mockActionCreate).not.toHaveBeenCalled();
  });
});
