/**
 * BDD Suite: URLs the API fetches on behalf of a caller.
 *
 * Given: a URL from a request or from stored data, with DNS answers and the
 *        network stubbed.
 * When: the URL is checked or fetched.
 * Then: only http and https URLs without credentials pass, and only when their
 *       origin is a service or listed origin or their host resolves to public
 *       addresses only; every redirect hop is checked again, and the exchange
 *       is bounded in time and size.
 */

const mockDefaultSettings = {
  API_SERVICE_URL: "http://api:4000",
  NEXT_PUBLIC_API_SERVICE_URL: "https://api.example.com",
  HOST_SERVICE_URL: "http://host:3000",
  NEXT_PUBLIC_HOST_SERVICE_URL: "https://example.com",
  OUTBOUND_URL_ALLOWED_ORIGINS: "",
  OUTBOUND_URL_TIMEOUT_MS: 30000,
  OUTBOUND_URL_MAX_RESPONSE_BYTES: 1024,
};
const mockSettings = { ...mockDefaultSettings };

jest.mock("@sps/shared-utils", () => ({
  get API_SERVICE_URL() {
    return mockSettings.API_SERVICE_URL;
  },
  get NEXT_PUBLIC_API_SERVICE_URL() {
    return mockSettings.NEXT_PUBLIC_API_SERVICE_URL;
  },
  get HOST_SERVICE_URL() {
    return mockSettings.HOST_SERVICE_URL;
  },
  get NEXT_PUBLIC_HOST_SERVICE_URL() {
    return mockSettings.NEXT_PUBLIC_HOST_SERVICE_URL;
  },
  get OUTBOUND_URL_ALLOWED_ORIGINS() {
    return mockSettings.OUTBOUND_URL_ALLOWED_ORIGINS;
  },
  get OUTBOUND_URL_TIMEOUT_MS() {
    return mockSettings.OUTBOUND_URL_TIMEOUT_MS;
  },
  get OUTBOUND_URL_MAX_RESPONSE_BYTES() {
    return mockSettings.OUTBOUND_URL_MAX_RESPONSE_BYTES;
  },
}));

jest.mock("node:dns/promises", () => ({
  lookup: jest.fn(),
}));

import { lookup } from "node:dns/promises";
import {
  assertOutboundUrl,
  fetchOutboundUrl,
  OUTBOUND_URL_MAX_REDIRECTS,
} from "./index";

const PUBLIC_ADDRESS = "93.184.215.14";
const NON_PUBLIC_MESSAGE =
  "Validation error. Outbound URL must resolve to public addresses only";

const mockLookup = lookup as unknown as jest.Mock;
const originalFetch = globalThis.fetch;
let mockFetch: jest.Mock;

function resolvesTo(...addresses: string[]) {
  mockLookup.mockResolvedValue(
    addresses.map((address) => ({
      address,
      family: address.includes(":") ? 6 : 4,
    })),
  );
}

function redirectTo(location: string, status = 302) {
  return new Response(null, { status, headers: { location } });
}

function streamOf(...chunkSizes: number[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunkSizes.forEach((size) => controller.enqueue(new Uint8Array(size)));
      controller.close();
    },
  });
}

function requestAt(index: number): { url: string; init: RequestInit } {
  const [url, init] = mockFetch.mock.calls[index];

  return { url: String(url), init };
}

function headersAt(index: number): Headers {
  return new Headers(requestAt(index).init.headers);
}

beforeEach(() => {
  Object.assign(mockSettings, mockDefaultSettings);
  mockLookup.mockReset();
  mockFetch = jest.fn();
  globalThis.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("Given: a URL outside the service origins names a non-public address", () => {
  /**
   * BDD Scenario: every non-public range is refused.
   *
   * Given: an http URL whose host is an address literal in a loopback,
   *        private, shared, link-local, unspecified, multicast, reserved,
   *        unique-local or IPv4-mapped range.
   * When: the URL is checked.
   * Then: it is refused with the public-address message, without a lookup.
   */
  it.each([
    ["IPv4 loopback", "http://127.0.0.1:4000/"],
    ["IPv4 loopback range", "http://127.1.2.3/"],
    ["loopback written as one number", "http://2130706433/"],
    ["loopback written in hexadecimal", "http://0x7f.1/"],
    ["private 10.0.0.0/8", "http://10.1.2.3/"],
    ["private 172.16.0.0/12, lower edge", "http://172.16.0.1/"],
    ["private 172.16.0.0/12, upper edge", "http://172.31.255.255/"],
    ["private 192.168.0.0/16", "http://192.168.1.1/"],
    ["the cloud metadata address", "http://169.254.169.254/latest/meta-data/"],
    ["shared address space", "http://100.100.100.200/"],
    ["this network", "http://0.0.0.0:4000/"],
    ["IPv4 multicast", "http://224.0.0.1/"],
    ["IPv4 reserved", "http://240.0.0.1/"],
    ["IPv4 broadcast", "http://255.255.255.255/"],
    ["IPv6 loopback", "http://[::1]:4000/"],
    ["IPv6 unspecified", "http://[::]/"],
    ["IPv6 unique-local", "http://[fd12:3456::1]/"],
    ["IPv6 link-local", "http://[fe80::1]/"],
    ["IPv6 multicast", "http://[ff02::1]/"],
    ["IPv4-mapped loopback", "http://[::ffff:127.0.0.1]/"],
    ["IPv4-mapped metadata address", "http://[::ffff:169.254.169.254]/"],
  ])("refuses %s", async (_range, url) => {
    await expect(assertOutboundUrl(url)).rejects.toThrow(NON_PUBLIC_MESSAGE);
    expect(mockLookup).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: addresses next to the refused ranges stay public.
   *
   * Given: an address literal just outside a refused range, or a public one.
   * When: the URL is checked.
   * Then: it passes and names that address as the one to connect to.
   */
  it.each([
    ["172.15.255.255", "http://172.15.255.255/"],
    ["172.32.0.1", "http://172.32.0.1/"],
    ["100.63.255.255", "http://100.63.255.255/"],
    ["100.128.0.1", "http://100.128.0.1/"],
    [PUBLIC_ADDRESS, `http://${PUBLIC_ADDRESS}/`],
    ["2606:4700::6810:85e5", "http://[2606:4700::6810:85e5]/"],
  ])("accepts the public address %s", async (address, url) => {
    await expect(assertOutboundUrl(url)).resolves.toMatchObject({ address });
  });
});

describe("Given: a URL names a host that must be resolved", () => {
  /**
   * BDD Scenario: a name that resolves to a private address.
   *
   * Given: a host name whose only answer is a private address.
   * When: the URL is checked.
   * Then: it is refused.
   */
  it("refuses a name that resolves to a private address", async () => {
    resolvesTo("10.0.0.5");

    await expect(
      assertOutboundUrl("http://postgres.internal/"),
    ).rejects.toThrow(NON_PUBLIC_MESSAGE);
    expect(mockLookup).toHaveBeenCalledWith("postgres.internal", {
      all: true,
    });
  });

  /**
   * BDD Scenario: a name with public and private answers.
   *
   * Given: a host name that answers with a public and a loopback address.
   * When: the URL is checked.
   * Then: it is refused, because the request could reach either answer.
   */
  it("refuses a name when any of its answers is non-public", async () => {
    resolvesTo(PUBLIC_ADDRESS, "127.0.0.1");

    await expect(
      assertOutboundUrl("https://mixed.example.com/image.png"),
    ).rejects.toThrow(NON_PUBLIC_MESSAGE);
  });

  /**
   * BDD Scenario: an answer that carries an IPv6 zone index.
   *
   * Given: a host name that answers with a link-local address and a zone.
   * When: the URL is checked.
   * Then: it is refused.
   */
  it("refuses a zone-indexed link-local answer", async () => {
    resolvesTo("fe80::1%eth0");

    await expect(
      assertOutboundUrl("http://link-local.example.com/"),
    ).rejects.toThrow(NON_PUBLIC_MESSAGE);
  });

  /**
   * BDD Scenario: non-public answers in the other forms a resolver writes.
   *
   * Given: a host name answering with a non-public address written in full,
   *        with a dotted IPv4 tail, in hexadecimal groups or in upper case.
   * When: the URL is checked.
   * Then: it is refused.
   */
  it.each([
    ["IPv6 loopback written in full", "0:0:0:0:0:0:0:1"],
    ["IPv4-mapped private address with a dotted tail", "::ffff:10.0.0.5"],
    ["IPv4-mapped metadata address in hexadecimal", "::ffff:a9fe:a9fe"],
    ["unique-local address in upper case", "FD00::1"],
    ["link-local address written in full", "fe80:0:0:0:0:0:0:1"],
  ])("refuses the %s", async (_form, address) => {
    resolvesTo(address);

    await expect(
      assertOutboundUrl("http://internal.example.com/"),
    ).rejects.toThrow(NON_PUBLIC_MESSAGE);
  });

  /**
   * BDD Scenario: public answers in the same forms.
   *
   * Given: a host name answering with a public address, compressed, written
   *        in full, or IPv4-mapped with a dotted tail.
   * When: the URL is checked.
   * Then: it passes.
   */
  it.each([
    "2001:4860:4860::8888",
    "2606:4700:0:0:0:0:6810:85e5",
    `::ffff:${PUBLIC_ADDRESS}`,
  ])("accepts the public answer %s", async (address) => {
    resolvesTo(address);

    await expect(
      assertOutboundUrl("https://images.example.com/cat.png"),
    ).resolves.toMatchObject({ address });
  });

  /**
   * BDD Scenario: a name that does not resolve.
   *
   * Given: a host name without an answer.
   * When: the URL is checked.
   * Then: it is refused with the same message as a private answer.
   */
  it("refuses a name that does not resolve with the same message", async () => {
    mockLookup.mockRejectedValue(
      Object.assign(new Error("getaddrinfo ENOTFOUND"), { code: "ENOTFOUND" }),
    );

    await expect(assertOutboundUrl("http://redis.internal/")).rejects.toThrow(
      NON_PUBLIC_MESSAGE,
    );
  });

  /**
   * BDD Scenario: a public name with IPv6 and IPv4 answers.
   *
   * Given: a host name that answers with a public IPv6 and a public IPv4
   *        address, IPv6 first.
   * When: the URL is checked.
   * Then: it passes and names the IPv4 address to connect to.
   */
  it("prefers the IPv4 answer of a public name", async () => {
    resolvesTo("2606:4700::6810:85e5", PUBLIC_ADDRESS);

    await expect(
      assertOutboundUrl("https://images.example.com/cat.png"),
    ).resolves.toMatchObject({ address: PUBLIC_ADDRESS });
  });
});

describe("Given: a URL with another scheme or with credentials", () => {
  /**
   * BDD Scenario: schemes other than http and https.
   *
   * Given: a file, s3, data or ftp URL.
   * When: the URL is checked.
   * Then: it is refused before any lookup.
   */
  it.each([
    "file:///etc/hostname",
    "s3://bucket/key",
    "data:text/plain,hello",
    "ftp://example.com/file",
  ])("refuses %s", async (url) => {
    await expect(assertOutboundUrl(url)).rejects.toThrow(
      "Validation error. Outbound URL must use http or https",
    );
    expect(mockLookup).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: credentials inside the URL.
   *
   * Given: an https URL with a user name and a password.
   * When: the URL is checked.
   * Then: it is refused.
   */
  it("refuses a URL that carries credentials", async () => {
    await expect(
      assertOutboundUrl("https://user:secret@example.com/image.png"),
    ).rejects.toThrow(
      "Validation error. Outbound URL must not contain credentials",
    );
  });

  /**
   * BDD Scenario: text that is not a URL.
   *
   * Given: a value that does not parse as a URL.
   * When: the value is checked.
   * Then: it is refused as an invalid url.
   */
  it("refuses a value that is not a URL", async () => {
    await expect(assertOutboundUrl("not a url")).rejects.toThrow(
      "Validation error. Invalid url",
    );
  });
});

describe("Given: a URL on one of the deployment's own origins", () => {
  /**
   * BDD Scenario: the API and host service origins.
   *
   * Given: URLs under API_SERVICE_URL, NEXT_PUBLIC_API_SERVICE_URL,
   *        HOST_SERVICE_URL and NEXT_PUBLIC_HOST_SERVICE_URL, whose internal
   *        names would resolve to private addresses.
   * When: each URL is checked.
   * Then: it passes without a lookup and without an address to connect to.
   */
  it.each([
    ["API_SERVICE_URL", "http://api:4000/api/ecommerce/orders/1/check"],
    [
      "NEXT_PUBLIC_API_SERVICE_URL",
      "https://api.example.com/api/rbac/subjects/1/check",
    ],
    [
      "HOST_SERVICE_URL",
      "http://host:3000/api/image-generator/image.png?width=500",
    ],
    ["NEXT_PUBLIC_HOST_SERVICE_URL", "https://example.com/logo.svg"],
  ])("accepts a URL under %s", async (_setting, url) => {
    resolvesTo("10.0.1.7");

    const target = await assertOutboundUrl(url);

    expect(target.url.href).toBe(url);
    expect(target.address).toBeUndefined();
    expect(mockLookup).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: the local development defaults.
   *
   * Given: API_SERVICE_URL is http://localhost:4000, as in local development.
   * When: the observer's pipe URL on that origin is checked.
   * Then: it passes although localhost is a loopback name.
   */
  it("accepts the local API origin", async () => {
    mockSettings.API_SERVICE_URL = "http://localhost:4000";

    const target = await assertOutboundUrl(
      "http://localhost:4000/api/ecommerce/orders/1/check",
    );

    expect(target.address).toBeUndefined();
    expect(mockLookup).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: origins listed by the operator.
   *
   * Given: OUTBOUND_URL_ALLOWED_ORIGINS lists two origins with stray spaces
   *        and an empty entry.
   * When: URLs on those origins are checked.
   * Then: both pass without a lookup.
   */
  it("accepts origins listed in OUTBOUND_URL_ALLOWED_ORIGINS", async () => {
    mockSettings.OUTBOUND_URL_ALLOWED_ORIGINS =
      " http://crm:8080 ,,https://llm.internal";

    await expect(
      assertOutboundUrl("http://crm:8080/api/leads"),
    ).resolves.toBeDefined();
    await expect(
      assertOutboundUrl("https://llm.internal/v1/models"),
    ).resolves.toBeDefined();
    expect(mockLookup).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: the same host on another port.
   *
   * Given: API_SERVICE_URL is http://localhost:4000.
   * When: a URL for localhost on the cache port is checked.
   * Then: it is refused, because only the exact origin is allowed.
   */
  it("refuses another port on an allowed host", async () => {
    mockSettings.API_SERVICE_URL = "http://localhost:4000";
    resolvesTo("::1", "127.0.0.1");

    await expect(assertOutboundUrl("http://localhost:6379/")).rejects.toThrow(
      NON_PUBLIC_MESSAGE,
    );
  });
});

describe("Given: fetchOutboundUrl requests a URL that passed the check", () => {
  /**
   * BDD Scenario: a plain-HTTP public host.
   *
   * Given: an http URL whose host resolves to a public address.
   * When: the URL is fetched.
   * Then: the request goes to that address with the original Host header and
   *       redirects handled by the wrapper, and the body reaches the caller.
   */
  it("sends plain HTTP to the checked address with the original host", async () => {
    resolvesTo(PUBLIC_ADDRESS);
    mockFetch.mockResolvedValue(new Response("image-bytes"));

    const response = await fetchOutboundUrl(
      "http://images.example.com:8080/cat.png?size=large",
    );

    await expect(response.text()).resolves.toBe("image-bytes");
    expect(requestAt(0).url).toBe(
      `http://${PUBLIC_ADDRESS}:8080/cat.png?size=large`,
    );
    expect(headersAt(0).get("host")).toBe("images.example.com:8080");
    expect(requestAt(0).init.redirect).toBe("manual");
  });

  /**
   * BDD Scenario: an HTTPS public host.
   *
   * Given: an https URL whose host resolves to a public address.
   * When: the URL is fetched.
   * Then: the request keeps the host name, so certificate verification
   *       applies to it.
   */
  it("sends HTTPS by name", async () => {
    resolvesTo(PUBLIC_ADDRESS);
    mockFetch.mockResolvedValue(new Response("image-bytes"));

    await fetchOutboundUrl("https://images.example.com/cat.png");

    expect(requestAt(0).url).toBe("https://images.example.com/cat.png");
    expect(headersAt(0).get("host")).toBeNull();
  });

  /**
   * BDD Scenario: a refused URL.
   *
   * Given: the cloud metadata address.
   * When: the URL is fetched.
   * Then: the call is refused and no request is sent.
   */
  it("sends nothing for a refused URL", async () => {
    await expect(
      fetchOutboundUrl("http://169.254.169.254/latest/meta-data/"),
    ).rejects.toThrow(NON_PUBLIC_MESSAGE);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: an allowed internal origin.
   *
   * Given: a URL under HOST_SERVICE_URL (http://host:3000).
   * When: the URL is fetched with a header.
   * Then: the request goes to the URL by name with the header unchanged.
   */
  it("sends a request to an allowed origin by name", async () => {
    mockFetch.mockResolvedValue(new Response("png"));

    await fetchOutboundUrl("http://host:3000/api/image-generator/image.png", {
      headers: { "X-RBAC-SECRET-KEY": "operator-secret" },
    });

    expect(requestAt(0).url).toBe(
      "http://host:3000/api/image-generator/image.png",
    );
    expect(headersAt(0).get("host")).toBeNull();
    expect(headersAt(0).get("x-rbac-secret-key")).toBe("operator-secret");
  });
});

describe("Given: the checked URL answers with a redirect", () => {
  /**
   * BDD Scenario: a redirect to the metadata address.
   *
   * Given: a public host that redirects to 169.254.169.254.
   * When: the URL is fetched.
   * Then: the redirect is refused and no second request is sent.
   */
  it("refuses a redirect to a non-public address", async () => {
    resolvesTo(PUBLIC_ADDRESS);
    mockFetch.mockResolvedValueOnce(
      redirectTo("http://169.254.169.254/latest/meta-data/"),
    );

    await expect(
      fetchOutboundUrl("https://images.example.com/cat.png"),
    ).rejects.toThrow(NON_PUBLIC_MESSAGE);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: a redirect to a name that resolves privately.
   *
   * Given: a public host that redirects to a name answering with a private
   *        address.
   * When: the URL is fetched.
   * Then: the redirect is refused and no second request is sent.
   */
  it("resolves and refuses a redirect to a private name", async () => {
    mockLookup
      .mockResolvedValueOnce([{ address: PUBLIC_ADDRESS, family: 4 }])
      .mockResolvedValueOnce([{ address: "10.0.0.5", family: 4 }]);
    mockFetch.mockResolvedValueOnce(redirectTo("http://portainer.internal/"));

    await expect(
      fetchOutboundUrl("https://images.example.com/cat.png"),
    ).rejects.toThrow(NON_PUBLIC_MESSAGE);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: a redirect to another public host.
   *
   * Given: a public host that redirects to a CDN over HTTPS.
   * When: the URL is fetched.
   * Then: the redirect is followed and the CDN body reaches the caller.
   */
  it("follows a redirect to a public host", async () => {
    resolvesTo(PUBLIC_ADDRESS);
    mockFetch
      .mockResolvedValueOnce(redirectTo("https://cdn.example.com/cat.png", 301))
      .mockResolvedValueOnce(new Response("cdn-bytes"));

    const response = await fetchOutboundUrl("http://images.example.com/cat");

    await expect(response.text()).resolves.toBe("cdn-bytes");
    expect(requestAt(1).url).toBe("https://cdn.example.com/cat.png");
  });

  /**
   * BDD Scenario: a relative redirect.
   *
   * Given: a plain-HTTP public host that redirects to a relative path.
   * When: the URL is fetched.
   * Then: the path is resolved against the answering URL and sent to the
   *       checked address with the original host.
   */
  it("resolves a relative location against the answering URL", async () => {
    resolvesTo(PUBLIC_ADDRESS);
    mockFetch
      .mockResolvedValueOnce(redirectTo("/images/cat.png"))
      .mockResolvedValueOnce(new Response("image-bytes"));

    await fetchOutboundUrl("http://images.example.com/cat");

    expect(requestAt(1).url).toBe(`http://${PUBLIC_ADDRESS}/images/cat.png`);
    expect(headersAt(1).get("host")).toBe("images.example.com");
  });

  /**
   * BDD Scenario: a 303 after a POST.
   *
   * Given: a POST with a form body that is answered with 303.
   * When: the redirect is followed.
   * Then: the next request is a GET without the body and its content type.
   */
  it("continues a 303 as a GET without the body", async () => {
    resolvesTo(PUBLIC_ADDRESS);
    mockFetch
      .mockResolvedValueOnce(redirectTo("https://example.org/result", 303))
      .mockResolvedValueOnce(new Response("{}"));

    await fetchOutboundUrl("https://example.org/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });

    expect(requestAt(1).init.method).toBe("GET");
    expect(requestAt(1).init.body).toBeUndefined();
    expect(headersAt(1).get("content-type")).toBeNull();
  });

  /**
   * BDD Scenario: a 307 after a POST.
   *
   * Given: a POST with a body that is answered with 307.
   * When: the redirect is followed.
   * Then: the next request repeats the method and the body.
   */
  it("repeats the method and body on a 307", async () => {
    resolvesTo(PUBLIC_ADDRESS);
    mockFetch
      .mockResolvedValueOnce(redirectTo("https://example.org/v2/submit", 307))
      .mockResolvedValueOnce(new Response("{}"));

    await fetchOutboundUrl("https://example.org/submit", {
      method: "POST",
      body: "payload",
    });

    expect(requestAt(1).init.method).toBe("POST");
    expect(requestAt(1).init.body).toBe("payload");
  });

  /**
   * BDD Scenario: credentials on a redirect to another origin.
   *
   * Given: a request with the operator secret, an Authorization header, a
   *        cookie and a tracing header, redirected to another origin.
   * When: the redirect is followed.
   * Then: the three credential headers are dropped and the tracing header is
   *       kept.
   */
  it("drops credential headers on a redirect to another origin", async () => {
    resolvesTo(PUBLIC_ADDRESS);
    mockFetch
      .mockResolvedValueOnce(redirectTo("https://other.example.net/hook"))
      .mockResolvedValueOnce(new Response("{}"));

    await fetchOutboundUrl("https://hooks.example.com/hook", {
      headers: {
        "X-RBAC-SECRET-KEY": "operator-secret",
        Authorization: "Bearer token",
        Cookie: "rbac.subject.jwt=token",
        "X-Request-Id": "trace-1",
      },
    });

    expect(headersAt(1).get("x-rbac-secret-key")).toBeNull();
    expect(headersAt(1).get("authorization")).toBeNull();
    expect(headersAt(1).get("cookie")).toBeNull();
    expect(headersAt(1).get("x-request-id")).toBe("trace-1");
  });

  /**
   * BDD Scenario: credentials on a redirect within one origin.
   *
   * Given: a request with the operator secret redirected to another path on
   *        the same origin.
   * When: the redirect is followed.
   * Then: the operator secret is kept.
   */
  it("keeps credential headers on a redirect within one origin", async () => {
    mockFetch
      .mockResolvedValueOnce(redirectTo("/api/ecommerce/orders/1/check/"))
      .mockResolvedValueOnce(new Response("{}"));

    await fetchOutboundUrl("http://api:4000/api/ecommerce/orders/1/check", {
      headers: { "X-RBAC-SECRET-KEY": "operator-secret" },
    });

    expect(headersAt(1).get("x-rbac-secret-key")).toBe("operator-secret");
  });

  /**
   * BDD Scenario: a redirect loop.
   *
   * Given: a public host that always redirects.
   * When: the URL is fetched.
   * Then: the call is refused after the redirect limit.
   */
  it("refuses more redirects than the limit", async () => {
    resolvesTo(PUBLIC_ADDRESS);
    mockFetch.mockImplementation(async () =>
      redirectTo("https://loop.example.com/again"),
    );

    await expect(
      fetchOutboundUrl("https://loop.example.com/start"),
    ).rejects.toThrow(
      `Validation error. Outbound URL redirected more than ${OUTBOUND_URL_MAX_REDIRECTS} times`,
    );
    expect(mockFetch).toHaveBeenCalledTimes(OUTBOUND_URL_MAX_REDIRECTS + 1);
  });
});

describe("Given: the response body is limited to 1024 bytes", () => {
  /**
   * BDD Scenario: a declared size above the cap.
   *
   * Given: a response whose Content-Length is above the cap.
   * When: the URL is fetched.
   * Then: the call is refused.
   */
  it("refuses a response that declares a larger size", async () => {
    resolvesTo(PUBLIC_ADDRESS);
    mockFetch.mockResolvedValue(
      new Response("small", { headers: { "content-length": "2048" } }),
    );

    await expect(
      fetchOutboundUrl("https://images.example.com/huge.png"),
    ).rejects.toThrow(
      "Validation error. Outbound URL response is larger than 1024 bytes",
    );
  });

  /**
   * BDD Scenario: a streamed body above the cap.
   *
   * Given: a response without Content-Length whose chunks add up to more than
   *        the cap.
   * When: the URL is fetched.
   * Then: the call is refused once the cap is passed.
   */
  it("refuses a streamed body that grows past the cap", async () => {
    resolvesTo(PUBLIC_ADDRESS);
    mockFetch.mockResolvedValue(new Response(streamOf(800, 800)));

    await expect(
      fetchOutboundUrl("https://images.example.com/stream"),
    ).rejects.toThrow(
      "Validation error. Outbound URL response is larger than 1024 bytes",
    );
  });

  /**
   * BDD Scenario: a body exactly at the cap.
   *
   * Given: a response of 1024 bytes with a status and a content type.
   * When: the URL is fetched.
   * Then: the caller receives the whole body, the status and the headers.
   */
  it("returns a body at the cap with its status and headers", async () => {
    resolvesTo(PUBLIC_ADDRESS);
    mockFetch.mockResolvedValue(
      new Response(streamOf(512, 512), {
        status: 203,
        headers: { "content-type": "image/png" },
      }),
    );

    const response = await fetchOutboundUrl(
      "https://images.example.com/cat.png",
    );
    const body = await response.blob();

    expect(body.size).toBe(1024);
    expect(response.status).toBe(203);
    expect(response.headers.get("content-type")).toBe("image/png");
  });
});

describe("Given: the target does not answer in time", () => {
  /**
   * BDD Scenario: a target that never answers.
   *
   * Given: OUTBOUND_URL_TIMEOUT_MS is 20 and the target never answers.
   * When: the URL is fetched.
   * Then: the call is refused with the deadline in the message.
   */
  it("refuses once the deadline passes", async () => {
    mockSettings.OUTBOUND_URL_TIMEOUT_MS = 20;
    resolvesTo(PUBLIC_ADDRESS);
    mockFetch.mockImplementation(
      (_url: URL, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(init.signal?.reason),
          );
        }),
    );

    await expect(
      fetchOutboundUrl("https://slow.example.com/cat.png"),
    ).rejects.toThrow(
      "Validation error. Outbound URL did not answer within 20 ms",
    );
  });
});
