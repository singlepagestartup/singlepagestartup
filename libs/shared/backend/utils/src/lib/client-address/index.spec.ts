/**
 * BDD Suite: client address of a request.
 *
 * Given: requests that reach the API directly or through reverse proxies that
 *        append the address they received a request from to X-Forwarded-For.
 * When: the client address is read with a number of trusted proxies.
 * Then: only an entry a trusted proxy appended, or the connection address, is
 *       returned; an IPv4-mapped IPv6 address collapses to IPv4; and addresses
 *       of private networks are told apart from public ones.
 */

import { Hono } from "hono";
import { isPrivateNetworkAddress, readClientAddress } from "./index";

function peer(address: string) {
  return {
    requestIP: () => ({ address, family: "IPv4", port: 51000 }),
  };
}

async function readAddress(props: {
  trustedProxies: number;
  forwardedFor?: string;
  connection?: string;
}) {
  const app = new Hono();

  app.get("/", (c) => {
    return c.json({
      address: readClientAddress(c, props.trustedProxies) ?? null,
    });
  });

  const response = await app.request(
    "/",
    {
      headers: props.forwardedFor
        ? { "X-Forwarded-For": props.forwardedFor }
        : {},
    },
    props.connection ? peer(props.connection) : undefined,
  );

  return (await response.json()).address;
}

describe("Given: a request that passed through reverse proxies", () => {
  /**
   * BDD Scenario
   * Given: one trusted proxy appended the address it saw after an entry the client wrote.
   * When: the client address is read with one trusted proxy.
   * Then: the entry the proxy appended is returned, not the one the client wrote.
   */
  it("returns the entry the trusted proxy appended, not the one the client wrote", async () => {
    await expect(
      readAddress({
        trustedProxies: 1,
        forwardedFor: "198.51.100.7, 203.0.113.9",
        connection: "10.0.1.5",
      }),
    ).resolves.toBe("203.0.113.9");
  });

  /**
   * BDD Scenario
   * Given: a chain of two trusted proxies, the outer one appending the client address.
   * When: the client address is read with two trusted proxies.
   * Then: both proxy hops are skipped and the client entry is returned.
   */
  it("skips every hop of a two-proxy chain", async () => {
    await expect(
      readAddress({
        trustedProxies: 2,
        forwardedFor: "198.51.100.7, 203.0.113.9, 162.158.1.2",
        connection: "10.0.1.5",
      }),
    ).resolves.toBe("203.0.113.9");
  });

  /**
   * BDD Scenario
   * Given: the header holds fewer entries than there are trusted proxies.
   * When: the client address is read.
   * Then: the furthest entry is returned.
   */
  it("returns the furthest entry when the header is shorter than the chain", async () => {
    await expect(
      readAddress({
        trustedProxies: 3,
        forwardedFor: "203.0.113.9",
        connection: "10.0.1.5",
      }),
    ).resolves.toBe("203.0.113.9");
  });

  /**
   * BDD Scenario
   * Given: a trusted proxy is configured but the request carries no forwarded entries.
   * When: the client address is read.
   * Then: the connection address is returned.
   */
  it("falls back to the connection address when nothing was forwarded", async () => {
    await expect(
      readAddress({ trustedProxies: 1, connection: "192.0.2.10" }),
    ).resolves.toBe("192.0.2.10");
  });
});

describe("Given: a request that reached the API directly", () => {
  /**
   * BDD Scenario
   * Given: no proxy is trusted and the client wrote its own X-Forwarded-For.
   * When: the client address is read.
   * Then: the connection address is returned and the header is ignored.
   */
  it("ignores X-Forwarded-For when no proxy is trusted", async () => {
    await expect(
      readAddress({
        trustedProxies: 0,
        forwardedFor: "203.0.113.9",
        connection: "192.0.2.10",
      }),
    ).resolves.toBe("192.0.2.10");
  });

  /**
   * BDD Scenario
   * Given: a dual-stack socket reports the peer as an IPv4-mapped IPv6 address.
   * When: the client address is read.
   * Then: the plain IPv4 form is returned.
   */
  it("collapses an IPv4-mapped IPv6 connection address to IPv4", async () => {
    await expect(
      readAddress({ trustedProxies: 0, connection: "::FFFF:192.0.2.10" }),
    ).resolves.toBe("192.0.2.10");
  });

  /**
   * BDD Scenario
   * Given: neither a forwarded entry nor connection information exists.
   * When: the client address is read.
   * Then: nothing is returned.
   */
  it("returns nothing when no source names an address", async () => {
    await expect(readAddress({ trustedProxies: 1 })).resolves.toBeNull();
  });
});

describe("Given: addresses from public and private networks", () => {
  /**
   * BDD Scenario
   * Given: loopback, RFC 1918, link-local, shared address space and IPv6 local addresses.
   * When: each is checked.
   * Then: each counts as a private network address.
   */
  it.each([
    "10.0.0.2",
    "127.0.0.1",
    "169.254.10.1",
    "172.16.0.1",
    "172.31.255.254",
    "192.168.1.1",
    "100.64.0.1",
    "100.127.255.1",
    "::1",
    "fc00::1",
    "fd12:3456::1",
    "fe80::1",
    "::ffff:10.0.0.2",
  ])("treats %s as a private network address", (address) => {
    expect(isPrivateNetworkAddress(address)).toBe(true);
  });

  /**
   * BDD Scenario
   * Given: public addresses, including neighbours of every private range.
   * When: each is checked.
   * Then: none counts as a private network address.
   */
  it.each([
    "203.0.113.9",
    "8.8.8.8",
    "172.15.0.1",
    "172.32.0.1",
    "100.63.0.1",
    "100.128.0.1",
    "192.169.0.1",
    "2001:db8::1",
    "fd::1",
    "",
  ])("treats %p as a public address", (address) => {
    expect(isPrivateNetworkAddress(address)).toBe(false);
  });
});
