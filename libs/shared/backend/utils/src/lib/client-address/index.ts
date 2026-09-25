import { Context } from "hono";

/**
 * What the Bun server tells about the peer of a request. Bun passes its server
 * to `app.fetch` as Hono's `env` (`apps/api/server.ts`); a request that did not
 * come through that server, such as a test request, has no peer information.
 */
interface IPeerAwareServer {
  requestIP: (request: Request) => { address: string } | null;
}

const IPV4_MAPPED_IPV6_PREFIX = "::ffff:";
const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function normalizeAddress(address?: string | null): string | undefined {
  const normalized = address?.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  // A dual-stack socket reports an IPv4 peer as `::ffff:a.b.c.d`; the same
  // client must count as one address whichever form it arrives in.
  if (
    normalized.startsWith(IPV4_MAPPED_IPV6_PREFIX) &&
    IPV4_PATTERN.test(normalized.slice(IPV4_MAPPED_IPV6_PREFIX.length))
  ) {
    return normalized.slice(IPV4_MAPPED_IPV6_PREFIX.length);
  }

  return normalized;
}

function readConnectionAddress(c: Context): string | undefined {
  const server = c.env as Partial<IPeerAwareServer> | undefined;

  if (typeof server?.requestIP !== "function") {
    return undefined;
  }

  try {
    return normalizeAddress(server.requestIP(c.req.raw)?.address);
  } catch {
    return undefined;
  }
}

/**
 * The address of the client that sent a request, as far as the proxies in
 * front of the API vouch for it.
 *
 * Every proxy appends the address it received the request from to
 * `X-Forwarded-For`, so only the entries the trusted proxies appended can be
 * believed; anything left of them was written by the client and can be
 * anything. Walking from the connection address leftwards, the first
 * `trustedProxies` hops are the proxies themselves and the next one is the
 * client. With no proxy (`0`) the connection address is the client; when the
 * header holds fewer entries than there are proxies, the furthest entry is
 * returned.
 */
export function readClientAddress(
  c: Context,
  trustedProxies: number,
): string | undefined {
  const hops =
    Number.isInteger(trustedProxies) && trustedProxies > 0 ? trustedProxies : 0;
  const forwarded = (c.req.header("X-Forwarded-For") || "")
    .split(",")
    .map((entry) => normalizeAddress(entry))
    .filter((entry): entry is string => Boolean(entry));
  const chain = [readConnectionAddress(c), ...forwarded.reverse()];

  return chain[Math.min(hops, chain.length - 1)];
}

/**
 * Whether an address belongs to a network no public client connects from:
 * IPv4 loopback, RFC 1918, link-local and the RFC 6598 shared address space,
 * and IPv6 loopback, unique-local and link-local. Such an address is a proxy,
 * a container network gateway (the swarm routing mesh hands every published
 * connection one ingress address), another service or a developer machine, so
 * it does not tell one client from another.
 */
export function isPrivateNetworkAddress(address: string): boolean {
  const normalized = normalizeAddress(address);

  if (!normalized) {
    return false;
  }

  const ipv4 = normalized.match(IPV4_PATTERN);

  if (ipv4) {
    const first = Number(ipv4[1]);
    const second = Number(ipv4[2]);

    return (
      first === 10 ||
      first === 127 ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 100 && second >= 64 && second <= 127)
    );
  }

  return (
    normalized === "::1" ||
    /^f[cd][0-9a-f]{2}:/.test(normalized) ||
    /^fe[89ab][0-9a-f]:/.test(normalized)
  );
}
