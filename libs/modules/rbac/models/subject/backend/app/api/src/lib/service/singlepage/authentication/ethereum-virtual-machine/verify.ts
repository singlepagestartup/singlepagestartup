import { IRepository } from "@sps/shared-backend-api";
import {
  RBAC_EVM_LEGACY_TIMESTAMP_MESSAGE,
  RBAC_EVM_MAX_CLOCK_SKEW_IN_SECONDS,
  RBAC_EVM_NONCE_LIFETIME_IN_SECONDS,
  RBAC_EVM_RPC_TIMEOUT_IN_MILLISECONDS,
  RBAC_EVM_RPC_URL,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Address, createPublicClient, Hex, http } from "viem";
import { mainnet } from "viem/chains";
import {
  consumeEvmNonceAction,
  getHostSiweOrigins,
  isAllowedSiweOrigin,
  isEvmAddress,
  isFreshTimestamp,
  nonceToActionId,
  parseLegacyTimestampMessage,
  parseSiweMessage,
  type TEvmPurpose,
} from "./utils";

/** The window the previous release enforced, kept only for the legacy branch. */
const LEGACY_MAX_AGE_IN_MILLISECONDS = 1000 * 60 * 5;

export type IExecuteProps = {
  data: {
    message: string;
    signature: Hex;
    address: Address;
  };
  purpose: TEvmPurpose;
};

export type IResult = {
  address: string;
  nonce?: string;
  legacy: boolean;
};

/**
 * The one place a wallet signature is checked, for the anonymous login route
 * and for the authenticated identity-linking route alike.
 *
 * The order matters: nothing is issued and nothing is written until the
 * challenge the server handed out has been claimed, and the claim is a single
 * conditional write, so a message that was already accepted once cannot be
 * accepted again.
 */
export class Service {
  repository: IRepository;

  constructor(repository: IRepository) {
    this.repository = repository;
  }

  async execute(props: IExecuteProps): Promise<IResult> {
    const { message, signature, address } = props.data || {};

    if (!message || !signature) {
      throw new Error("Validation error. Invalid message or signature");
    }

    if (!isEvmAddress(address)) {
      throw new Error("Validation error. Invalid address");
    }

    const parsed = parseSiweMessage(message);

    if (!parsed) {
      return this.executeLegacy(props);
    }

    if (
      !isAllowedSiweOrigin({
        domain: parsed.domain,
        uri: parsed.uri,
        allowedOrigins: this.getAllowedOrigins(),
      })
    ) {
      throw new Error("Validation error. Invalid domain in message");
    }

    if (
      !isFreshTimestamp({
        issuedAt: Date.parse(parsed.issuedAt),
        now: Date.now(),
        maxAgeInMilliseconds: this.getNonceLifetimeSeconds() * 1000,
        maxSkewInMilliseconds: this.getMaxClockSkewSeconds() * 1000,
      })
    ) {
      throw new Error("Validation error. Invalid date in message");
    }

    if (parsed.address.toLowerCase() !== address.toLowerCase()) {
      throw new Error("Validation error. Invalid address in message");
    }

    const actionId = nonceToActionId(parsed.nonce);

    if (!actionId) {
      throw new Error("Validation error. Invalid nonce in message");
    }

    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    await this.assertSignature({ message, signature, address });

    const consumed = await consumeEvmNonceAction({
      id: actionId,
      secretKey: RBAC_SECRET_KEY,
    });

    if (!consumed) {
      throw new Error("Authentication error. Challenge is used or expired");
    }

    const evm = (consumed.payload as { [key: string]: any })?.["evm"] || {};

    if (evm["purpose"] !== props.purpose) {
      throw new Error("Authentication error. Challenge purpose does not match");
    }

    if (evm["address"] !== address.toLowerCase()) {
      throw new Error("Authentication error. Challenge address does not match");
    }

    if (evm["chainId"] !== parsed.chainId) {
      throw new Error("Authentication error. Challenge chain does not match");
    }

    return {
      address: address.toLowerCase(),
      nonce: parsed.nonce,
      legacy: false,
    };
  }

  /**
   * The bare millisecond timestamp the previous release signed. It is read
   * only while the compatibility flag is on, and the lower bound applies here
   * too: the point of this change is that a future-dated value is refused, and
   * a project migrating its client does not get to keep that hole.
   */
  protected async executeLegacy(props: IExecuteProps): Promise<IResult> {
    if (!this.isLegacyTimestampMessageAllowed()) {
      throw new Error("Validation error. Invalid message");
    }

    const { message, signature, address } = props.data;
    const issuedAt = parseLegacyTimestampMessage(message);

    if (issuedAt === undefined) {
      throw new Error("Validation error. Invalid message");
    }

    if (
      !isFreshTimestamp({
        issuedAt,
        now: Date.now(),
        maxAgeInMilliseconds: LEGACY_MAX_AGE_IN_MILLISECONDS,
        maxSkewInMilliseconds: this.getMaxClockSkewSeconds() * 1000,
      })
    ) {
      throw new Error("Validation error. Invalid date in message");
    }

    await this.assertSignature({ message, signature, address });

    return {
      address: address.toLowerCase(),
      legacy: true,
    };
  }

  protected async assertSignature(props: {
    message: string;
    signature: Hex;
    address: Address;
  }) {
    // viem falls back to local recovery when the onchain validator call fails,
    // and rethrows when that fallback cannot confirm the signature either. A
    // slow or unreachable RPC therefore surfaces as an error rather than as a
    // silent "invalid signature", which is why the deadline is safe to set.
    const valid = await this.getPublicClient().verifyMessage(props);

    if (!valid) {
      throw new Error("Validation error. Invalid signature");
    }
  }

  protected getPublicClient() {
    return createPublicClient({
      chain: mainnet,
      transport: http(RBAC_EVM_RPC_URL || undefined, {
        timeout: RBAC_EVM_RPC_TIMEOUT_IN_MILLISECONDS,
      }),
    });
  }

  protected getAllowedOrigins() {
    return getHostSiweOrigins();
  }

  protected getNonceLifetimeSeconds() {
    return RBAC_EVM_NONCE_LIFETIME_IN_SECONDS;
  }

  protected getMaxClockSkewSeconds() {
    return RBAC_EVM_MAX_CLOCK_SKEW_IN_SECONDS;
  }

  protected isLegacyTimestampMessageAllowed() {
    return RBAC_EVM_LEGACY_TIMESTAMP_MESSAGE;
  }
}
