/**
 * BDD Suite: CORS origin selection for the API, Telegram and OpenAPI apps.
 *
 * Given: an app that answers browsers with credentials allowed, and
 *        API_CORS_ALLOWED_ORIGINS either empty or set to a comma-separated list.
 * When: a preflight or a request arrives with or without an Origin header.
 * Then: an empty list echoes every origin, a set list echoes only its own
 *       entries, and a request without an Origin header is answered with no
 *       allow-origin header in both modes.
 */

let mockAllowedOrigins = "";

jest.mock("@sps/shared-utils", () => ({
  get API_CORS_ALLOWED_ORIGINS() {
    return mockAllowedOrigins;
  },
}));

import { Hono } from "hono";
import { cors } from "hono/cors";
import { resolveCorsOrigin } from "./index";

const LISTED_ORIGIN = "https://app.example.com";
const SECOND_LISTED_ORIGIN = "https://admin.example.com";
const UNLISTED_ORIGIN = "https://unlisted.example.net";

function createCorsApp() {
  const app = new Hono();

  app.use(
    cors({
      origin: resolveCorsOrigin,
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  app.get("/resource", (c) => {
    return c.json({ ok: true });
  });

  return app;
}

function sendPreflight(origin: string) {
  return createCorsApp().request("/resource", {
    method: "OPTIONS",
    headers: {
      Origin: origin,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization",
    },
  });
}

function sendRequest(origin?: string) {
  return createCorsApp().request("/resource", {
    headers: origin ? { Origin: origin } : {},
  });
}

describe("Given: API_CORS_ALLOWED_ORIGINS is empty", () => {
  beforeEach(() => {
    mockAllowedOrigins = "";
  });

  /**
   * BDD Scenario: a preflight from any origin.
   *
   * Given: no origin list is configured.
   * When: a browser sends a credentialed preflight from an arbitrary origin.
   * Then: the origin is echoed with credentials allowed, as before the list
   *       existed, so local development and tunnels keep working.
   */
  it("echoes any origin on a preflight and allows credentials", async () => {
    const response = await sendPreflight(UNLISTED_ORIGIN);

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      UNLISTED_ORIGIN,
    );
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBe(
      "true",
    );
  });

  /**
   * BDD Scenario: a request from any origin.
   *
   * Given: no origin list is configured.
   * When: a browser sends a request from an arbitrary origin.
   * Then: the handler answers and the origin is echoed.
   */
  it("echoes any origin on a request", async () => {
    const response = await sendRequest(LISTED_ORIGIN);

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      LISTED_ORIGIN,
    );
  });

  /**
   * BDD Scenario: a request without an Origin header.
   *
   * Given: no origin list is configured.
   * When: a server-to-server caller sends a request without an Origin header.
   * Then: the handler answers and no allow-origin header is sent.
   */
  it("answers a request without an Origin header and sends no allow-origin header", async () => {
    const response = await sendRequest();

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});

describe("Given: API_CORS_ALLOWED_ORIGINS lists two origins", () => {
  beforeEach(() => {
    mockAllowedOrigins = `${LISTED_ORIGIN},${SECOND_LISTED_ORIGIN}`;
  });

  /**
   * BDD Scenario: a preflight from a listed origin.
   *
   * Given: the list names the calling origin.
   * When: a browser sends a credentialed preflight from it.
   * Then: the origin is echoed with credentials allowed.
   */
  it("echoes each listed origin on a preflight", async () => {
    for (const origin of [LISTED_ORIGIN, SECOND_LISTED_ORIGIN]) {
      const response = await sendPreflight(origin);

      expect(response.status).toBe(204);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
      expect(response.headers.get("Access-Control-Allow-Credentials")).toBe(
        "true",
      );
    }
  });

  /**
   * BDD Scenario: a preflight from an unlisted origin.
   *
   * Given: the list does not name the calling origin.
   * When: a browser sends a credentialed preflight from it.
   * Then: no allow-origin header is sent, so the browser never sends the
   *       request that the preflight announced.
   */
  it("sends no allow-origin header on a preflight from an unlisted origin", async () => {
    const response = await sendPreflight(UNLISTED_ORIGIN);

    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  /**
   * BDD Scenario: a request from an unlisted origin.
   *
   * Given: the list does not name the calling origin.
   * When: a browser sends a request that needs no preflight from it.
   * Then: no allow-origin header is sent, so the browser keeps the response
   *       from the calling page.
   */
  it("sends no allow-origin header on a request from an unlisted origin", async () => {
    const response = await sendRequest(UNLISTED_ORIGIN);

    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  /**
   * BDD Scenario: origins that only resemble a listed one.
   *
   * Given: the list names https://app.example.com.
   * When: a preflight arrives from another scheme, another port, a longer host
   *       ending in the listed one, a host that extends it, or the opaque null
   *       origin.
   * Then: none of them is echoed, because only an exact match counts.
   */
  it("refuses origins that only resemble a listed one", async () => {
    for (const origin of [
      "http://app.example.com",
      "https://app.example.com:8443",
      "https://evil-app.example.com",
      "https://app.example.com.unlisted.example.net",
      "null",
    ]) {
      const response = await sendPreflight(origin);

      expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    }
  });

  /**
   * BDD Scenario: a list written with spaces and empty entries.
   *
   * Given: the list carries spaces around its entries and an empty entry.
   * When: a preflight arrives from each listed origin.
   * Then: both are echoed, because entries are trimmed and blanks dropped.
   */
  it("ignores spaces and empty entries in the list", async () => {
    mockAllowedOrigins = ` ${LISTED_ORIGIN} , , ${SECOND_LISTED_ORIGIN} `;

    for (const origin of [LISTED_ORIGIN, SECOND_LISTED_ORIGIN]) {
      const response = await sendPreflight(origin);

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    }
  });

  /**
   * BDD Scenario: a request without an Origin header.
   *
   * Given: an origin list is configured.
   * When: a server-to-server caller sends a request without an Origin header.
   * Then: the handler answers and no allow-origin header is sent, so the list
   *       never blocks a caller that is not a browser.
   */
  it("answers a request without an Origin header and sends no allow-origin header", async () => {
    const response = await sendRequest();

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
