import { IRepository } from "@sps/shared-backend-api";
import {
  RBAC_EVM_NONCE_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { api as rbacActionApi } from "@sps/rbac/models/action/sdk/server";
import {
  actionIdToNonce,
  buildSiweMessage,
  buildSiweStatement,
  EVM_NONCE_ACTION_TYPE,
  getHostSiweOrigins,
  isEvmAddress,
  isEvmPurpose,
  type TEvmPurpose,
} from "./utils";

export type IExecuteProps = {
  data: {
    address: string;
    purpose?: TEvmPurpose;
    chainId?: number;
  };
};

export type IResult = {
  nonce: string;
  message: string;
  issuedAt: string;
  expiresAt: string;
};

/**
 * Issues the challenge a wallet login signs.
 *
 * The value that bounds freshness is now one the server wrote down, with an
 * expiry and a single-use marker, instead of a number the client chose.
 */
export class Service {
  repository: IRepository;

  constructor(repository: IRepository) {
    this.repository = repository;
  }

  async execute(props: IExecuteProps): Promise<IResult> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const purpose = props.data?.purpose || "authentication";

    if (!isEvmPurpose(purpose)) {
      throw new Error("Validation error. Invalid purpose");
    }

    const address = props.data?.address;

    if (!isEvmAddress(address)) {
      throw new Error("Validation error. Invalid address");
    }

    const [origin] = this.getAllowedOrigins();

    if (!origin) {
      throw new Error(
        "Configuration error. NEXT_PUBLIC_HOST_SERVICE_URL is not a valid url",
      );
    }

    const chainId = this.resolveChainId(props.data?.chainId);
    const issuedAt = new Date();
    const expiresAt = new Date(
      issuedAt.getTime() + this.getNonceLifetimeSeconds() * 1000,
    );

    const action = await rbacActionApi.create({
      data: {
        expiresAt,
        payload: {
          type: EVM_NONCE_ACTION_TYPE,
          evm: {
            purpose,
            address: address.toLowerCase(),
            chainId,
            consumedAt: null,
          },
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    const nonce = actionIdToNonce(action.id);

    return {
      nonce,
      message: this.buildMessage({
        domain: new URL(origin).host,
        address,
        statement: buildSiweStatement({
          domain: new URL(origin).host,
          purpose,
        }),
        uri: origin,
        version: "1",
        chainId,
        nonce,
        issuedAt: issuedAt.toISOString(),
        expirationTime: expiresAt.toISOString(),
      }),
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * The message template. A project that wants its own wording overrides this
   * one method in `service/startup`; the verifier parses the EIP-4361 shape
   * rather than the wording, so the two stay compatible.
   */
  protected buildMessage(props: Parameters<typeof buildSiweMessage>[0]) {
    return buildSiweMessage(props);
  }

  protected getAllowedOrigins() {
    return getHostSiweOrigins();
  }

  protected getNonceLifetimeSeconds() {
    return RBAC_EVM_NONCE_LIFETIME_IN_SECONDS;
  }

  /**
   * `personal_sign` is chain-agnostic, so the chain id is not a security
   * boundary here - it is carried so the wallet shows the user the network
   * they asked for, and compared on verify against what was issued.
   */
  protected resolveChainId(chainId?: number) {
    return Number.isInteger(chainId) && (chainId as number) > 0
      ? (chainId as number)
      : 1;
  }
}
