import { NEXT_PUBLIC_HOST_SERVICE_URL } from "@sps/shared-utils";
import { api as rbacActionApi } from "@sps/rbac/models/action/sdk/server";

/**
 * Helpers for the wallet login services in this folder.
 *
 * `nonce.ts` and `verify.ts` each export a `Service`; these are the message
 * handling and the single-use claim they share, kept here so the folder does
 * not mix the two kinds. They stay beside the flow because both know the shape
 * of this exchange and nothing outside it uses them.
 */

/**
 * EIP-4361 ("Sign-In with Ethereum") message handling, shared by the service
 * that issues a challenge and the service that verifies one, so the two ends
 * cannot drift.
 *
 * The server builds the whole message. The wallet signs it unchanged and the
 * client posts it back unchanged, which is what makes the nonce, the domain
 * and the timestamp part of the signed payload rather than values the client
 * picked for itself.
 */

export type TEvmPurpose = "authentication" | "link";

export const EVM_PURPOSES: TEvmPurpose[] = ["authentication", "link"];

export const EVM_NONCE_ACTION_TYPE = "evm-nonce";

export interface ISiweMessage {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
}

const PREAMBLE_SUFFIX = " wants you to sign in with your Ethereum account:";
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
/** EIP-4361 restricts the nonce to alphanumerics, so the uuid loses its dashes. */
const NONCE = /^[0-9a-f]{32}$/;
const TIMESTAMP_MESSAGE = /^\d+$/;
const UUID_GROUPS = /^(.{8})(.{4})(.{4})(.{4})(.{12})$/;

export function isEvmAddress(value: unknown): value is string {
  return typeof value === "string" && ADDRESS.test(value);
}

export function isEvmPurpose(value: unknown): value is TEvmPurpose {
  return EVM_PURPOSES.includes(value as TEvmPurpose);
}

/**
 * The nonce is the action row's own id, so the existing single-use consume
 * claims it. Only the formatting differs: EIP-4361 allows alphanumerics only.
 */
export function actionIdToNonce(id: string): string {
  return id.replaceAll("-", "");
}

export function nonceToActionId(nonce: string): string | undefined {
  if (!NONCE.test(nonce)) {
    return undefined;
  }

  const groups = UUID_GROUPS.exec(nonce);

  if (!groups) {
    return undefined;
  }

  return groups.slice(1).join("-");
}

/**
 * The origins a signed message may name. It is derived from the host the
 * application is served on; a project that signs in on more than one origin
 * widens the list through the service seam.
 */
export function getHostSiweOrigins(): string[] {
  try {
    return [new URL(NEXT_PUBLIC_HOST_SERVICE_URL).origin];
  } catch (error) {
    return [];
  }
}

export function isAllowedSiweOrigin(props: {
  domain: string;
  uri: string;
  allowedOrigins: string[];
}): boolean {
  const { domain, uri, allowedOrigins } = props;

  const allowedHosts = allowedOrigins.map((origin) => {
    try {
      return new URL(origin).host;
    } catch (error) {
      return "";
    }
  });

  if (!allowedHosts.includes(domain)) {
    return false;
  }

  try {
    return allowedOrigins.includes(new URL(uri).origin);
  } catch (error) {
    return false;
  }
}

export function buildSiweStatement(props: {
  domain: string;
  purpose: TEvmPurpose;
}): string {
  return props.purpose === "link"
    ? `Link this wallet to your ${props.domain} account.`
    : `Sign in to ${props.domain} with your wallet.`;
}

export function buildSiweMessage(props: ISiweMessage): string {
  const lines = [
    `${props.domain}${PREAMBLE_SUFFIX}`,
    props.address,
    "",
    ...(props.statement ? [props.statement, ""] : []),
    `URI: ${props.uri}`,
    `Version: ${props.version}`,
    `Chain ID: ${props.chainId}`,
    `Nonce: ${props.nonce}`,
    `Issued At: ${props.issuedAt}`,
    ...(props.expirationTime
      ? [`Expiration Time: ${props.expirationTime}`]
      : []),
  ];

  return lines.join("\n");
}

/**
 * Returns the parsed message, or `undefined` when the input is not one. A
 * bare timestamp - the message the previous release signed - parses to
 * `undefined` here and is handled only by the legacy branch of the verifier.
 */
export function parseSiweMessage(message: unknown): ISiweMessage | undefined {
  if (typeof message !== "string" || !message) {
    return undefined;
  }

  const lines = message.split("\n");

  if (lines.length < 7) {
    return undefined;
  }

  const [preamble, address, firstBlank] = lines;

  if (!preamble.endsWith(PREAMBLE_SUFFIX)) {
    return undefined;
  }

  const domain = preamble.slice(0, preamble.length - PREAMBLE_SUFFIX.length);

  if (!domain || !ADDRESS.test(address) || firstBlank !== "") {
    return undefined;
  }

  let cursor = 3;
  let statement: string | undefined;

  // An optional statement sits between two blank lines, so a message without
  // one goes straight from the address to the labelled fields.
  if (!lines[cursor].startsWith("URI: ")) {
    if (!lines[cursor] || lines[cursor + 1] !== "") {
      return undefined;
    }

    statement = lines[cursor];
    cursor += 2;
  }

  const fields: { [key: string]: string } = {};

  for (const line of lines.slice(cursor)) {
    const separator = line.indexOf(": ");

    if (separator < 1) {
      return undefined;
    }

    const key = line.slice(0, separator);

    if (key in fields) {
      return undefined;
    }

    fields[key] = line.slice(separator + 2);
  }

  const uri = fields["URI"];
  const version = fields["Version"];
  const chainId = fields["Chain ID"];
  const nonce = fields["Nonce"];
  const issuedAt = fields["Issued At"];

  if (!uri || !version || !chainId || !nonce || !issuedAt) {
    return undefined;
  }

  if (!/^\d+$/.test(chainId) || !NONCE.test(nonce)) {
    return undefined;
  }

  if (Number.isNaN(Date.parse(issuedAt))) {
    return undefined;
  }

  return {
    domain,
    address,
    statement,
    uri,
    version,
    chainId: Number(chainId),
    nonce,
    issuedAt,
    expirationTime: fields["Expiration Time"],
  };
}

/**
 * The message the previous release signed: a bare millisecond timestamp. It
 * is read only while `RBAC_EVM_LEGACY_TIMESTAMP_MESSAGE` is on, and only the
 * exact digits are taken - the old `parseInt` also accepted digits followed by
 * anything at all.
 */
export function parseLegacyTimestampMessage(
  message: unknown,
): number | undefined {
  if (typeof message !== "string" || !TIMESTAMP_MESSAGE.test(message)) {
    return undefined;
  }

  const value = Number(message);

  return Number.isFinite(value) ? value : undefined;
}

/**
 * Freshness in both directions. The previous check subtracted the claimed time
 * from the current one and compared the result with an upper bound only, so a
 * value dated in the future stayed acceptable for as long as it stayed ahead.
 */
export function isFreshTimestamp(props: {
  issuedAt: number;
  now: number;
  maxAgeInMilliseconds: number;
  maxSkewInMilliseconds: number;
}): boolean {
  const age = props.now - props.issuedAt;

  return (
    age >= -props.maxSkewInMilliseconds && age <= props.maxAgeInMilliseconds
  );
}

/**
 * Claims a wallet login challenge exactly once.
 *
 * Every test that decides whether the challenge is still usable travels with
 * the write: the row is still an EVM nonce, it has not been consumed, and it
 * has not expired. Two requests holding the same nonce therefore cannot both
 * proceed, and `null` is the loser's answer. The row that comes back carries
 * the payload the challenge was issued with, so the purpose and the address it
 * was bound to are read from the claim itself rather than from a separate
 * lookup that the claim could race with.
 *
 * The type test is not decoration. Without it a caller could name any action
 * row - an OAuth state, an exchange code - and have it marked consumed.
 */
export async function consumeEvmNonceAction(props: {
  id: string;
  secretKey: string;
}) {
  const consumedAt = new Date().toISOString();

  return rbacActionApi.consume({
    id: props.id,
    data: {
      consumedAt,
    },
    filters: {
      and: [
        {
          column: "payload->>type",
          method: "eq",
          value: EVM_NONCE_ACTION_TYPE,
        },
        {
          column: "consumedAt",
          method: "isNull",
        },
        {
          column: "expiresAt",
          method: "gt",
          value: consumedAt,
        },
      ],
    },
    options: {
      headers: {
        "X-RBAC-SECRET-KEY": props.secretKey,
      },
    },
  });
}
