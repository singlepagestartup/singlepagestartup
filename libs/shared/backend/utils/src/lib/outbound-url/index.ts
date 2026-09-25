import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import {
  API_SERVICE_URL,
  HOST_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_URL,
  NEXT_PUBLIC_HOST_SERVICE_URL,
  OUTBOUND_URL_ALLOWED_ORIGINS,
  OUTBOUND_URL_MAX_RESPONSE_BYTES,
  OUTBOUND_URL_TIMEOUT_MS,
} from "@sps/shared-utils";

export interface IOutboundUrlTarget {
  url: URL;
  /**
   * The resolved address that passed the check. Absent for an allowed origin,
   * which is requested by name.
   */
  address?: string;
}

/** Redirect hops followed before the request is refused. */
export const OUTBOUND_URL_MAX_REDIRECTS = 5;

const ALLOWED_PROTOCOLS = ["http:", "https:"];

/**
 * Ranges a checked host must not resolve to, as network and prefix length.
 *
 * They are matched on the address bytes rather than with `BlockList` from
 * `node:net`, whose `check` matches nothing in the Bun release the API runs
 * (1.2.5). An IPv4 address is compared in its IPv4-mapped IPv6 form, so
 * `::ffff:127.0.0.1` meets the same rule as `127.0.0.1`.
 */
const NON_PUBLIC_RANGES: [string, number][] = [
  ["0.0.0.0", 8], // this network, including the unspecified address
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // shared address space (carrier-grade NAT)
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, including the metadata address
  ["172.16.0.0", 12], // private
  ["192.168.0.0", 16], // private
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, including broadcast
  ["::", 128], // unspecified
  ["::1", 128], // loopback
  ["fc00::", 7], // unique-local
  ["fe80::", 10], // link-local
  ["ff00::", 8], // multicast
];

const REDIRECT_STATUSES = [301, 302, 303, 307, 308];

/** Headers describing a request body, dropped when a redirect drops the body. */
const BODY_HEADERS = [
  "content-encoding",
  "content-language",
  "content-length",
  "content-location",
  "content-type",
];

/** Headers that must not follow a redirect to another origin. */
const CREDENTIAL_HEADERS = [
  "authorization",
  "cookie",
  "proxy-authorization",
  "x-rbac-secret-key",
];

/**
 * Throws a `Validation error` unless the API may fetch `value` on behalf of a
 * caller (issue #307). `base` resolves a relative redirect location against the
 * URL that answered with it.
 *
 * The API container shares networks with the database, the cache and the other
 * services, and Bun's `fetch` also reads `file:` URLs from disk and signs `s3:`
 * URLs with the process credentials. A URL from a request or from stored data
 * therefore passes only as `http` or `https` without credentials, and only when
 * its origin is one of the API and host service URLs or is listed in
 * `OUTBOUND_URL_ALLOWED_ORIGINS`, or when its host resolves to public addresses
 * only. A host that does not resolve gets the same message as one that resolves
 * to a private address, so the answer does not reveal which internal names
 * exist.
 */
export async function assertOutboundUrl(
  value: string | URL,
  base?: URL,
): Promise<IOutboundUrlTarget> {
  let url: URL;

  try {
    url = new URL(value, base);
  } catch {
    throw new Error("Validation error. Invalid url");
  }

  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    throw new Error("Validation error. Outbound URL must use http or https");
  }

  if (url.username || url.password) {
    throw new Error(
      "Validation error. Outbound URL must not contain credentials",
    );
  }

  if (getAllowedOrigins().includes(url.origin)) {
    return { url };
  }

  const hostname = url.hostname.replace(/^\[(.*)\]$/, "$1");
  const addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await lookup(hostname, { all: true }).catch(() => []);

  if (
    !addresses.length ||
    !addresses.every(({ address }) => isPublicAddress(address))
  ) {
    throw new Error(
      "Validation error. Outbound URL must resolve to public addresses only",
    );
  }

  const { address } =
    addresses.find(({ family }) => family === 4) ?? addresses[0];

  return { url, address };
}

/**
 * `fetch` for a URL the API received from a caller or from stored data.
 *
 * Every hop passes `assertOutboundUrl` before a connection is opened, and
 * redirects are followed here rather than by `fetch` so that each location is
 * checked too. A 303, and a 301 or 302 answering a POST, continue as a GET
 * without the body, as `fetch` itself does; a hop to another origin drops the
 * credential headers. The returned response holds the body already read, so
 * the size cap applies before the caller sees any of it.
 */
export async function fetchOutboundUrl(
  value: string | URL,
  init: RequestInit = {},
): Promise<Response> {
  const deadline = AbortSignal.timeout(OUTBOUND_URL_TIMEOUT_MS);
  const signal = init.signal
    ? AbortSignal.any([init.signal, deadline])
    : deadline;

  let request: RequestInit & { headers: Headers } = {
    ...init,
    headers: new Headers(init.headers),
  };
  let location: string | URL = value;
  let previous: URL | undefined;

  try {
    for (let redirects = 0; ; redirects++) {
      const target = await assertOutboundUrl(location, previous);

      if (previous && previous.origin !== target.url.origin) {
        CREDENTIAL_HEADERS.forEach((name) => request.headers.delete(name));
      }

      const connection = getConnection(target, request.headers);
      const response = await fetch(connection.url, {
        ...request,
        headers: connection.headers,
        redirect: "manual",
        signal,
      });
      const next = response.headers.get("location");

      if (!REDIRECT_STATUSES.includes(response.status) || !next) {
        return await readBody(response);
      }

      await response.body?.cancel();

      if (redirects === OUTBOUND_URL_MAX_REDIRECTS) {
        throw new Error(
          `Validation error. Outbound URL redirected more than ${OUTBOUND_URL_MAX_REDIRECTS} times`,
        );
      }

      request = getRedirectedRequest(request, response.status);
      location = next;
      previous = target.url;
    }
  } catch (error) {
    if (deadline.aborted) {
      throw new Error(
        `Validation error. Outbound URL did not answer within ${OUTBOUND_URL_TIMEOUT_MS} ms`,
      );
    }

    throw error;
  }
}

function getAllowedOrigins(): string[] {
  return [
    API_SERVICE_URL,
    NEXT_PUBLIC_API_SERVICE_URL,
    HOST_SERVICE_URL,
    NEXT_PUBLIC_HOST_SERVICE_URL,
    ...OUTBOUND_URL_ALLOWED_ORIGINS.split(","),
  ].flatMap((value) => {
    try {
      const url = new URL(value.trim());

      return ALLOWED_PROTOCOLS.includes(url.protocol) ? [url.origin] : [];
    } catch {
      return [];
    }
  });
}

function isPublicAddress(address: string): boolean {
  // A zone index ("fe80::1%eth0") names an interface and is not part of the
  // address.
  const [host] = address.split("%");

  if (!isIP(host)) {
    return false;
  }

  const bytes = toBytes(host);

  return !NON_PUBLIC_RANGES.some(([network, prefix]) =>
    hasPrefix(
      bytes,
      toBytes(network),
      isIP(network) === 4 ? prefix + 96 : prefix,
    ),
  );
}

/**
 * The 16 bytes of a valid IP address. An IPv4 address becomes its IPv4-mapped
 * IPv6 form (`::ffff:a.b.c.d`), and a dotted IPv4 tail inside an IPv6 address
 * counts as its last two groups.
 */
function toBytes(address: string): number[] {
  if (isIP(address) === 4) {
    return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xff, 0xff].concat(
      address.split(".").map(Number),
    );
  }

  const toGroups = (part: string): number[] =>
    part
      .split(":")
      .filter(Boolean)
      .flatMap((group) => {
        if (!group.includes(".")) {
          return [parseInt(group, 16)];
        }

        const [a, b, c, d] = group.split(".").map(Number);

        return [(a << 8) | b, (c << 8) | d];
      });

  const [head, tail] = address.split("::");
  const headGroups = toGroups(head);
  const tailGroups = tail === undefined ? [] : toGroups(tail);
  const zeros = new Array(8 - headGroups.length - tailGroups.length).fill(0);

  return [...headGroups, ...zeros, ...tailGroups].flatMap((group) => [
    group >> 8,
    group & 0xff,
  ]);
}

/** Whether the first `bits` bits of two 16-byte addresses are equal. */
function hasPrefix(
  address: number[],
  network: number[],
  bits: number,
): boolean {
  for (let bit = 0; bit < bits; bit++) {
    const index = Math.floor(bit / 8);
    const mask = 0x80 >> bit % 8;

    if ((address[index] & mask) !== (network[index] & mask)) {
      return false;
    }
  }

  return true;
}

/**
 * A plain-HTTP request goes to the address that passed the check, with the
 * original host in the `Host` header, because `fetch` would otherwise resolve
 * the name again and could receive another answer. HTTPS keeps the name:
 * certificate verification refuses a server that answers for another address.
 */
function getConnection(
  target: IOutboundUrlTarget,
  headers: Headers,
): { url: URL; headers: Headers } {
  if (!target.address || target.url.protocol !== "http:") {
    return { url: target.url, headers };
  }

  const url = new URL(target.url);
  url.hostname =
    isIP(target.address) === 6 ? `[${target.address}]` : target.address;

  const connectionHeaders = new Headers(headers);
  connectionHeaders.set("host", target.url.host);

  return { url, headers: connectionHeaders };
}

function getRedirectedRequest(
  request: RequestInit & { headers: Headers },
  status: number,
): RequestInit & { headers: Headers } {
  const method = (request.method ?? "GET").toUpperCase();

  if (
    (status === 303 && !["GET", "HEAD"].includes(method)) ||
    ([301, 302].includes(status) && method === "POST")
  ) {
    const headers = new Headers(request.headers);
    BODY_HEADERS.forEach((name) => headers.delete(name));

    return { ...request, method: "GET", body: undefined, headers };
  }

  return request;
}

/**
 * Reads the body up to `OUTBOUND_URL_MAX_RESPONSE_BYTES` and returns it as a
 * new response with the original status and headers.
 */
async function readBody(response: Response): Promise<Response> {
  const declaredSize = Number(response.headers.get("content-length"));

  if (declaredSize > OUTBOUND_URL_MAX_RESPONSE_BYTES) {
    await response.body?.cancel();

    throw new Error(
      `Validation error. Outbound URL response is larger than ${OUTBOUND_URL_MAX_RESPONSE_BYTES} bytes`,
    );
  }

  const chunks: Uint8Array[] = [];
  let size = 0;

  if (response.body) {
    const reader = response.body.getReader();

    for (;;) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      size += value.byteLength;

      if (size > OUTBOUND_URL_MAX_RESPONSE_BYTES) {
        await reader.cancel();

        throw new Error(
          `Validation error. Outbound URL response is larger than ${OUTBOUND_URL_MAX_RESPONSE_BYTES} bytes`,
        );
      }

      chunks.push(value);
    }
  }

  return new Response(size ? Buffer.concat(chunks) : null, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
