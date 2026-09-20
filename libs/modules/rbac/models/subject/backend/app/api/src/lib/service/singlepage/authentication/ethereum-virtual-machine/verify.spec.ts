/**
 * BDD Suite: EVM signature verification against a server-issued challenge.
 *
 * Given: the server issued a single-use nonce bound to this application and a short lifetime.
 * When: a wallet signature over an EIP-4361 message is presented for verification.
 * Then: only a well-formed, same-domain, in-window message whose nonce is still unconsumed is accepted.
 */

const mockConsume = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  NEXT_PUBLIC_HOST_SERVICE_URL: "https://host.example",
  RBAC_EVM_LEGACY_TIMESTAMP_MESSAGE: false,
  RBAC_EVM_MAX_CLOCK_SKEW_IN_SECONDS: 0,
  RBAC_EVM_NONCE_LIFETIME_IN_SECONDS: 120,
  RBAC_EVM_RPC_TIMEOUT_IN_MILLISECONDS: 5000,
  RBAC_EVM_RPC_URL: "",
  RBAC_SECRET_KEY: "test-rbac-secret",
}));

jest.mock("@sps/rbac/models/action/sdk/server", () => ({
  api: {
    consume: (...args: unknown[]) => mockConsume(...args),
  },
}));

import { verifyMessage as verifyMessageLocally } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { buildSiweMessage } from "./utils";
import { Service } from "./verify";

const ADDRESS = "0xAbC0000000000000000000000000000000000001";
const NONCE = "0123456789abcdef0123456789abcdef";
const ACTION_ID = "01234567-89ab-cdef-0123-456789abcdef";
const SIGNATURE = "0xsignature" as const;

class TestService extends Service {
  signatureValid = jest.fn(async () => true);
  legacyAllowed = false;

  protected getPublicClient() {
    return { verifyMessage: this.signatureValid } as any;
  }

  protected isLegacyTimestampMessageAllowed() {
    return this.legacyAllowed;
  }
}

function createService(props?: { legacyAllowed?: boolean }) {
  const service = new TestService({} as any);
  service.legacyAllowed = props?.legacyAllowed || false;

  return service;
}

function createMessage(overrides?: {
  domain?: string;
  uri?: string;
  address?: string;
  chainId?: number;
  nonce?: string;
  issuedAt?: string;
}) {
  return buildSiweMessage({
    domain: overrides?.domain ?? "host.example",
    address: overrides?.address ?? ADDRESS,
    statement: "Sign in to host.example with your wallet.",
    uri: overrides?.uri ?? "https://host.example",
    version: "1",
    chainId: overrides?.chainId ?? 1,
    nonce: overrides?.nonce ?? NONCE,
    issuedAt: overrides?.issuedAt ?? new Date().toISOString(),
  });
}

function createConsumedRow(overrides?: {
  purpose?: string;
  address?: string;
  chainId?: number;
}) {
  return {
    id: ACTION_ID,
    payload: {
      type: "evm-nonce",
      evm: {
        purpose: overrides?.purpose ?? "authentication",
        address: overrides?.address ?? ADDRESS.toLowerCase(),
        chainId: overrides?.chainId ?? 1,
        consumedAt: null,
      },
    },
  };
}

function execute(service: Service, message: string, purpose?: "link") {
  return service.execute({
    data: {
      message,
      signature: SIGNATURE as any,
      address: ADDRESS as any,
    },
    purpose: purpose || "authentication",
  });
}

describe("Given: a wallet presents a signature for a server-issued challenge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsume.mockResolvedValue(createConsumedRow());
  });

  /**
   * BDD Scenario: the ordinary successful login.
   *
   * Given: a message the server built, still inside its window.
   * When: it is verified.
   * Then: the address comes back and the challenge was claimed.
   */
  it("accepts a well-formed message whose nonce is unconsumed and in window", async () => {
    const service = createService();

    const result = await execute(service, createMessage());

    expect(result.address).toBe(ADDRESS.toLowerCase());
    expect(result.nonce).toBe(NONCE);
    expect(result.legacy).toBe(false);
    expect(mockConsume).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: the direction the previous check never bounded.
   *
   * Given: a message dated ahead of the server clock.
   * When: it is verified.
   * Then: it is refused, and no challenge is claimed.
   */
  it("rejects a message whose issuedAt is in the future", async () => {
    const service = createService();

    await expect(
      execute(
        service,
        createMessage({
          issuedAt: new Date(Date.now() + 60 * 1000).toISOString(),
        }),
      ),
    ).rejects.toThrow("Invalid date in message");
    expect(mockConsume).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: a message older than the challenge lifetime.
   *
   * Given: an issuedAt beyond the configured window.
   * When: it is verified.
   * Then: it is refused.
   */
  it("rejects a message whose issuedAt is older than the window", async () => {
    const service = createService();

    await expect(
      execute(
        service,
        createMessage({
          issuedAt: new Date(Date.now() - 121 * 1000).toISOString(),
        }),
      ),
    ).rejects.toThrow("Invalid date in message");
    expect(mockConsume).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: the message the previous release signed.
   *
   * Given: a bare millisecond timestamp and the compatibility flag off.
   * When: it is verified.
   * Then: it is refused as a malformed message.
   */
  it("rejects a bare timestamp message when the legacy flag is off", async () => {
    const service = createService();

    await expect(execute(service, Date.now().toString())).rejects.toThrow(
      "Invalid message",
    );
    expect(mockConsume).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: a signature produced for another site.
   *
   * Given: a message naming a domain the application is not served on.
   * When: it is verified.
   * Then: it is refused.
   */
  it("rejects a message whose domain is not an allowed domain", async () => {
    const service = createService();

    await expect(
      execute(service, createMessage({ domain: "evil.example" })),
    ).rejects.toThrow("Invalid domain in message");
    expect(mockConsume).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: the right domain with the wrong origin.
   *
   * Given: a message whose URI resolves off the allowed origin.
   * When: it is verified.
   * Then: it is refused.
   */
  it("rejects a message whose URI does not match the allowed origin", async () => {
    const service = createService();

    await expect(
      execute(service, createMessage({ uri: "https://evil.example/login" })),
    ).rejects.toThrow("Invalid domain in message");
    expect(mockConsume).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: a replay of an accepted message.
   *
   * Given: the conditional claim matches no row because it is already consumed.
   * When: the same message is verified again.
   * Then: it is refused.
   */
  it("rejects a nonce that was already consumed", async () => {
    const service = createService();
    mockConsume.mockResolvedValue(null);

    await expect(execute(service, createMessage())).rejects.toThrow(
      "Challenge is used or expired",
    );
  });

  /**
   * BDD Scenario: a nonce the server never issued.
   *
   * Given: the claim matches no row at all.
   * When: the message is verified.
   * Then: it is refused.
   */
  it("rejects a nonce that does not exist", async () => {
    const service = createService();
    mockConsume.mockResolvedValue(undefined);

    await expect(execute(service, createMessage())).rejects.toThrow(
      "Challenge is used or expired",
    );
  });

  /**
   * BDD Scenario: a login challenge presented to the linking flow.
   *
   * Given: a challenge issued for authentication.
   * When: it is verified for the link purpose.
   * Then: it is refused.
   */
  it("rejects a nonce issued for a different purpose", async () => {
    const service = createService();

    await expect(execute(service, createMessage(), "link")).rejects.toThrow(
      "Challenge purpose does not match",
    );
  });

  /**
   * BDD Scenario: a challenge bound to somebody else's wallet.
   *
   * Given: the claimed row was issued for another address.
   * When: the message is verified.
   * Then: it is refused.
   */
  it("rejects a nonce issued for a different address", async () => {
    const service = createService();
    mockConsume.mockResolvedValue(
      createConsumedRow({
        address: "0x0000000000000000000000000000000000000002",
      }),
    );

    await expect(execute(service, createMessage())).rejects.toThrow(
      "Challenge address does not match",
    );
  });

  /**
   * BDD Scenario: the claim carries every usability test with it.
   *
   * Given: a challenge is redeemed.
   * When: the conditional write is issued.
   * Then: it matches only an unconsumed, unexpired row of the nonce type.
   */
  it("claims the challenge under a single-use, unexpired, typed predicate", async () => {
    const service = createService();

    await execute(service, createMessage());

    const [call] = mockConsume.mock.calls;
    expect(call[0].id).toBe(ACTION_ID);
    expect(call[0].filters.and).toEqual([
      { column: "payload->>type", method: "eq", value: "evm-nonce" },
      { column: "consumedAt", method: "isNull" },
      { column: "expiresAt", method: "gt", value: expect.any(String) },
    ]);
  });

  /**
   * BDD Scenario: the signature does not belong to the claimed wallet.
   *
   * Given: recovery does not produce the claimed address.
   * When: the message is verified.
   * Then: it is refused, and the challenge is left unclaimed.
   */
  it("rejects a valid message when the signature does not recover to the claimed address", async () => {
    const service = createService();
    service.signatureValid.mockResolvedValue(false);

    await expect(execute(service, createMessage())).rejects.toThrow(
      "Invalid signature",
    );
    expect(mockConsume).not.toHaveBeenCalled();
  });
});

describe("Given: a project keeps the legacy timestamp message for one release", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsume.mockResolvedValue(createConsumedRow());
  });

  /**
   * BDD Scenario: the flag in its on position.
   *
   * Given: the compatibility flag is on.
   * When: a recent bare timestamp is verified.
   * Then: it is accepted, and no challenge is claimed because none was issued.
   */
  it("accepts a recent bare timestamp message when the legacy flag is on", async () => {
    const service = createService({ legacyAllowed: true });

    const result = await execute(service, Date.now().toString());

    expect(result.legacy).toBe(true);
    expect(result.address).toBe(ADDRESS.toLowerCase());
    expect(mockConsume).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: the flag restores the format, not the hole.
   *
   * Given: the compatibility flag is on.
   * When: a future-dated bare timestamp is verified.
   * Then: it is still refused.
   */
  it("still rejects a future-dated timestamp when the legacy flag is on", async () => {
    const service = createService({ legacyAllowed: true });

    await expect(
      execute(service, (Date.now() + 60 * 60 * 1000).toString()),
    ).rejects.toThrow("Invalid date in message");
  });

  /**
   * BDD Scenario: the old upper bound is unchanged on the legacy path.
   *
   * Given: the compatibility flag is on.
   * When: a timestamp older than five minutes is verified.
   * Then: it is refused, as it was before this change.
   */
  it("rejects a stale bare timestamp when the legacy flag is on", async () => {
    const service = createService({ legacyAllowed: true });

    await expect(
      execute(service, (Date.now() - 6 * 60 * 1000).toString()),
    ).rejects.toThrow("Invalid date in message");
  });

  /**
   * BDD Scenario: the old parser accepted digits followed by anything.
   *
   * Given: the compatibility flag is on.
   * When: a message of digits followed by text is verified.
   * Then: it is refused rather than truncated to its leading digits.
   */
  it("rejects digits followed by text when the legacy flag is on", async () => {
    const service = createService({ legacyAllowed: true });

    await expect(execute(service, `${Date.now()} please sign`)).rejects.toThrow(
      "Invalid message",
    );
  });
});

describe("Given: a real wallet key signs the message the server built", () => {
  /**
   * Recovery runs locally, so this suite never reaches an RPC endpoint - the
   * point is that the message this repository builds is one a wallet's own
   * signature verifies against.
   */
  class OfflineService extends Service {
    legacyAllowed = false;

    protected getPublicClient() {
      return { verifyMessage: verifyMessageLocally } as any;
    }

    protected isLegacyTimestampMessageAllowed() {
      return this.legacyAllowed;
    }
  }

  const wallet = privateKeyToAccount(
    "0x1111111111111111111111111111111111111111111111111111111111111111",
  );
  const otherWallet = privateKeyToAccount(
    "0x2222222222222222222222222222222222222222222222222222222222222222",
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsume.mockResolvedValue(
      createConsumedRow({ address: wallet.address.toLowerCase() }),
    );
  });

  /**
   * BDD Scenario: the whole round trip.
   *
   * Given: the message template this repository builds.
   * When: the wallet signs it and the signature is verified.
   * Then: the address comes back and the challenge is claimed.
   */
  it("accepts a signature the wallet produced over the built message", async () => {
    const message = createMessage({ address: wallet.address });
    const signature = await wallet.signMessage({ message });

    const result = await new OfflineService({} as any).execute({
      data: { message, signature, address: wallet.address },
      purpose: "authentication",
    });

    expect(result.address).toBe(wallet.address.toLowerCase());
    expect(mockConsume).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: somebody else's signature over the same message.
   *
   * Given: a message naming one wallet, signed by another.
   * When: it is verified.
   * Then: it is refused before the challenge is claimed.
   */
  it("refuses a signature produced by a different key", async () => {
    const message = createMessage({ address: wallet.address });
    const signature = await otherWallet.signMessage({ message });

    await expect(
      new OfflineService({} as any).execute({
        data: { message, signature, address: wallet.address },
        purpose: "authentication",
      }),
    ).rejects.toThrow("Invalid signature");
    expect(mockConsume).not.toHaveBeenCalled();
  });
});
