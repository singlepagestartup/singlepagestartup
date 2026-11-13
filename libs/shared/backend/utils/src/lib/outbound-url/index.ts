import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { requestOutboundUrl } from "./transport";
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

export interface IOutboundUrlPolicy {
  /** Only trusted observer configuration may use all deployment service origins. */
  allowServiceOrigins?: boolean;
  /** One server-constructed URL, such as the host image generator. */
  allowedUrl?: string;
}

export interface IFetchOutboundUrlOptions extends IOutboundUrlPolicy {
  /**
   * Largest body read, in bytes. Defaults to `OUTBOUND_URL_MAX_RESPONSE_BYTES`;
   * a caller whose download has a limit of its own, such as the file-storage
   * upload limit, passes that limit here.
   */
  maxResponseBytes?: number;
  /**
   * The limit named in the refusal, "The <limitName> limit is N bytes".
   * Defaults to "response".
   */
  limitName?: string;
}

/** Redirect hops followed before the request is refused. */
export const OUTBOUND_URL_MAX_REDIRECTS = 5;

const ALLOWED_PROTOCOLS = ["http:", "https:"];

/**
 * Ranges a checked host must not resolve to, as network and prefix length.
 *
 * Compare address bytes so behavior does not depend on the runtime's BlockList
 * implementation. An IPv4 address is compared in its IPv4-mapped IPv6 form,
 * so `::ffff:127.0.0.1` meets the same rule as `127.0.0.1`.
 */
const NON_PUBLIC_RANGES: [string, number][] = [
  ["0.0.0.0", 8], // this network, including the unspecified address
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // shared address space (carrier-grade NAT)
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, including the metadata address
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // protocol assignments
  ["192.0.2.0", 24], // documentation
  ["192.88.99.0", 24], // deprecated relay
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // documentation
  ["203.0.113.0", 24], // documentation
  ["2001::", 23], // special uses, including Teredo
  ["2001:db8::", 32], // documentation
  ["2002::", 16], // 6to4 can embed private IPv4 destinations
  ["3fff::", 20], // documentation
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

/**
 * Validates one destination. Only fetchOutboundUrl also binds the connection
 * to that address; checking here and then calling ordinary fetch is unsafe.
 */
export async function assertOutboundUrl(
  value: string | URL,
  base?: URL,
  policy: IOutboundUrlPolicy = {},
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

  if (
    url.href === policy.allowedUrl ||
    getAllowedOrigins(policy).includes(url.origin)
  ) {
    return { url };
  }

  const hostname = url.hostname.replace(/^\[(.*)\]$/, "$1");
  let addresses;
  if (isIP(hostname)) {
    addresses = [{ address: hostname, family: isIP(hostname) }];
  } else {
    addresses = await lookup(hostname, { all: true }).catch(() => []);
  }

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
 * Downloads an untrusted HTTP(S) URL. Each hop is
 * validated, public addresses are pinned, and TLS still verifies the original
 * hostname. The deadline covers DNS, redirects and the bounded decoded body.
 */
export async function fetchOutboundUrl(
  value: string | URL,
  init: RequestInit = {},
  options: IFetchOutboundUrlOptions = {},
): Promise<Response> {
  const limit = {
    maxResponseBytes:
      options.maxResponseBytes ?? OUTBOUND_URL_MAX_RESPONSE_BYTES,
    limitName: options.limitName ?? "response",
  };

  if (
    !Number.isSafeInteger(limit.maxResponseBytes) ||
    limit.maxResponseBytes <= 0
  ) {
    throw new Error(
      "Configuration error. Invalid outbound response size limit",
    );
  }

  if (
    !Number.isSafeInteger(OUTBOUND_URL_TIMEOUT_MS) ||
    OUTBOUND_URL_TIMEOUT_MS <= 0 ||
    OUTBOUND_URL_TIMEOUT_MS > 2147483647
  ) {
    throw new Error("Configuration error. Invalid outbound request timeout");
  }

  const deadline = new AbortController();
  const timer = setTimeout(() => deadline.abort(), OUTBOUND_URL_TIMEOUT_MS);
  const signal = init.signal
    ? AbortSignal.any([init.signal, deadline.signal])
    : deadline.signal;

  let request: RequestInit & { headers: Headers } = {
    method: init.method,
    body: init.body,
    headers: new Headers(init.headers),
  };
  let location: string | URL = value;
  let previous: URL | undefined;
  let redirects = 0;

  try {
    while (redirects <= OUTBOUND_URL_MAX_REDIRECTS) {
      signal.throwIfAborted();
      const target = await withAbort(
        assertOutboundUrl(location, previous, options),
        signal,
      );
      signal.throwIfAborted();

      if (previous && previous.origin !== target.url.origin) {
        const method = (request.method ?? "GET").toUpperCase();

        if (!["GET", "HEAD"].includes(method) || request.body != null) {
          throw new Error(
            "Validation error. Outbound URL cannot forward a request body or mutation to another origin",
          );
        }

        // Arbitrary header names can contain credentials. Forward none of them.
        request.headers = new Headers();
      }

      if (previous?.protocol === "https:" && target.url.protocol === "http:") {
        throw new Error(
          "Validation error. Outbound URL cannot redirect HTTPS to HTTP",
        );
      }

      const { response, close } = await requestOutboundUrl(
        target,
        request,
        signal,
      );

      try {
        const next = response.headers.get("location");

        if (!REDIRECT_STATUSES.includes(response.status) || !next) {
          return await readBody(response, limit, signal);
        }

        await withAbort(response.body?.cancel() ?? Promise.resolve(), signal);

        if (redirects === OUTBOUND_URL_MAX_REDIRECTS) {
          throw new Error(
            `Validation error. Outbound URL redirected more than ${OUTBOUND_URL_MAX_REDIRECTS} times`,
          );
        }

        request = getRedirectedRequest(request, response.status);
        location = next;
        previous = target.url;
        redirects += 1;
      } finally {
        await close();
      }
    }

    throw new Error("Validation error. Outbound URL redirect limit exceeded");
  } catch (error) {
    if (deadline.signal.aborted) {
      throw new Error(
        `Validation error. Outbound URL did not answer within ${OUTBOUND_URL_TIMEOUT_MS} ms`,
      );
    }

    throw error;
  } finally {
    clearTimeout(timer);
    deadline.abort();
  }
}

/** DNS lookup itself cannot be cancelled; a late answer must never start IO. */
function withAbort<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener("abort", onAbort);
      reject(signal.reason);
    };
    signal.addEventListener("abort", onAbort, { once: true });

    if (signal.aborted) {
      onAbort();
    }

    operation.then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", onAbort);
    });
  });
}

function getAllowedOrigins(policy: IOutboundUrlPolicy): string[] {
  const values = OUTBOUND_URL_ALLOWED_ORIGINS.split(",");

  if (policy.allowServiceOrigins) {
    values.push(
      API_SERVICE_URL,
      NEXT_PUBLIC_API_SERVICE_URL,
      HOST_SERVICE_URL,
      NEXT_PUBLIC_HOST_SERVICE_URL,
    );
  }

  return values.flatMap((value) => {
    try {
      const url = new URL(value.trim());

      if (
        ALLOWED_PROTOCOLS.includes(url.protocol) &&
        !url.username &&
        !url.password
      ) {
        return [url.origin];
      }

      return [];
    } catch {
      return [];
    }
  });
}

function isPublicAddress(address: string): boolean {
  if (!isIP(address) || address.includes("%")) {
    return false;
  }

  const bytes = toBytes(address);
  const isMappedIpv4 = hasPrefix(bytes, toBytes("::ffff:0.0.0.0"), 96);

  // Only global-unicast IPv6, or mapped IPv4 checked below. This also refuses
  // IPv4-compatible, NAT64 and local-use translation prefixes.
  if (
    isIP(address) === 6 &&
    !isMappedIpv4 &&
    !hasPrefix(bytes, toBytes("2000::"), 3)
  ) {
    return false;
  }

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
    const mask = 0x80 >> (bit % 8);

    if ((address[index] & mask) !== (network[index] & mask)) {
      return false;
    }
  }

  return true;
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
 * Reads the body up to `limit.maxResponseBytes` and returns it as a new
 * response with the original status and headers. A declared `Content-Length`
 * above the limit is refused before the body is read; any other body is counted
 * while it streams, and the stream is cancelled as soon as it passes the limit.
 */
async function readBody(
  response: Response,
  limit: { maxResponseBytes: number; limitName: string },
  signal: AbortSignal,
): Promise<Response> {
  const tooLargeMessage = `Payload Too Large error. The ${limit.limitName} limit is ${limit.maxResponseBytes} bytes`;

  if (Number(response.headers.get("content-length")) > limit.maxResponseBytes) {
    void response.body?.cancel().catch(() => undefined);
    throw new Error(tooLargeMessage);
  }

  const headers = new Headers(response.headers);
  let body: ReadableStream<Uint8Array> | null = response.body;
  const encoding = headers.get("content-encoding")?.trim().toLowerCase();

  if (body && encoding && encoding !== "identity") {
    if (!["gzip", "deflate", "br"].includes(encoding)) {
      void body.cancel().catch(() => undefined);
      throw new Error(
        "Validation error. Unsupported outbound response encoding",
      );
    }

    let compressedBytes = 0;
    const format = encoding === "br" ? "brotli" : encoding;
    body = body
      .pipeThrough(
        new TransformStream<Uint8Array, Uint8Array<ArrayBuffer>>({
          transform(chunk, controller) {
            compressedBytes += chunk.byteLength;

            if (compressedBytes > limit.maxResponseBytes) {
              throw new Error(tooLargeMessage);
            }

            controller.enqueue(new Uint8Array(chunk));
          },
        }),
      )
      .pipeThrough(
        new DecompressionStream(
          format as ConstructorParameters<typeof DecompressionStream>[0],
        ),
      );
    headers.delete("content-encoding");
  }

  const chunks: Uint8Array[] = [];
  let size = 0;

  if (body) {
    const reader = body.getReader();

    try {
      let chunk = await withAbort(reader.read(), signal);

      while (!chunk.done) {
        size += chunk.value.byteLength;

        if (size > limit.maxResponseBytes) {
          throw new Error(tooLargeMessage);
        }

        chunks.push(chunk.value);
        chunk = await withAbort(reader.read(), signal);
      }
    } catch (error) {
      void reader.cancel().catch(() => undefined);
      throw error;
    } finally {
      reader.releaseLock();
    }
  }

  headers.set("content-length", String(size));

  return new Response(size ? Buffer.concat(chunks) : null, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
