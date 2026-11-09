import { Context } from "hono";
import { BlockList, isIP } from "node:net";

interface IPeerAwareServer {
  requestIP: (request: Request) => { address: string } | null;
}

const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function normalizeAddress(address?: string | null): string | undefined {
  const value = address?.trim().toLowerCase();
  if (!value || value.includes("%") || !isIP(value)) {
    return undefined;
  }
  if (isIP(value) === 4) {
    return value;
  }
  const canonical = new URL(`http://[${value}]`).hostname.slice(1, -1);
  const mapped = canonical.match(/^::ffff:([a-f0-9]+):([a-f0-9]+)$/);
  if (mapped) {
    const high = parseInt(mapped[1], 16);
    const low = parseInt(mapped[2], 16);
    return [high >>> 8, high & 255, low >>> 8, low & 255].join(".");
  }
  return canonical;
}

/** IPv6 privacy addresses share a /64 budget instead of 2^64 independent keys. */
export function clientAddressRateLimitKey(address: string): string {
  if (isIP(address) !== 6) {
    return address;
  }
  const [head, tail = ""] = address.split("::");
  const left = head.split(":").filter(Boolean);
  const right = tail.split(":").filter(Boolean);
  const groups = [
    ...left,
    ...Array(8 - left.length - right.length).fill("0"),
    ...right,
  ];
  return (
    groups
      .slice(0, 4)
      .map((group) => parseInt(group, 16).toString(16))
      .join(":") + "::/64"
  );
}

/** Trust each proxy's network, walking right-to-left until the first untrusted IP. */
export function createClientAddressReader(trustedProxyCidrs: string[] = []) {
  const trusted = new BlockList();
  for (const cidr of trustedProxyCidrs) {
    const [address, prefix] = cidr.split("/");
    const version = isIP(address);
    if (!version || prefix === undefined || !/^\d+$/.test(prefix)) {
      throw new Error("Configuration error. Invalid trusted proxy CIDR");
    }
    const type = version === 4 ? "ipv4" : "ipv6";
    trusted.addSubnet(address, Number(prefix), type);
  }

  return (c: Context): string | undefined => {
    const server = c.env as Partial<IPeerAwareServer> | undefined;
    if (typeof server?.requestIP !== "function") {
      return undefined;
    }
    let address = normalizeAddress(server.requestIP(c.req.raw)?.address);
    if (!address) {
      return undefined;
    }
    const forwarded = (c.req.header("X-Forwarded-For") || "").split(",");
    for (const entry of forwarded.reverse()) {
      const type = isIP(address) === 4 ? "ipv4" : "ipv6";
      if (!trusted.check(address, type)) {
        break;
      }
      const next = normalizeAddress(entry);
      if (!next) {
        break;
      }
      address = next;
    }
    return address;
  };
}

export function readClientAddress(
  c: Context,
  trustedProxyCidrs: string[] = [],
) {
  const read = createClientAddressReader(trustedProxyCidrs);
  return read(c);
}

/**
 * Whether an address belongs to a network no public client connects from:
 * IPv4 loopback, RFC 1918, link-local and the RFC 6598 shared address space,
 * and IPv6 loopback, unique-local and link-local. This classifies an address; it does not exempt it from rate limits.
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
