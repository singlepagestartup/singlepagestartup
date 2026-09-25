/**
 * BDD Suite: observer pipeline request targets.
 *
 * Given: the observer middleware with the broadcast SDKs, DNS answers and the
 *        network stubbed, and the API service URL set to its internal name.
 * When: a stored pipeline step names the URL to call.
 * Then: a step on the API's own origin is sent with its headers and clears
 *       the message; a step that names a non-public address is not sent and
 *       the message stays.
 */

const mockChannelFind = jest.fn();
const mockChannelMessageFind = jest.fn();
const mockMessageDelete = jest.fn();
const mockLoggerError = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "operator-secret",
  API_SERVICE_URL: "http://api:4000",
  NEXT_PUBLIC_API_SERVICE_URL: "http://api:4000",
  HOST_SERVICE_URL: "http://host:3000",
  NEXT_PUBLIC_HOST_SERVICE_URL: "https://example.com",
  OUTBOUND_URL_ALLOWED_ORIGINS: "",
}));

jest.mock("@sps/backend-utils", () => ({
  ...jest.requireActual("@sps/backend-utils"),
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("@sps/broadcast/models/channel/sdk/server", () => ({
  api: {
    find: (...args: unknown[]) => mockChannelFind(...args),
    messageFind: (...args: unknown[]) => mockChannelMessageFind(...args),
  },
}));

jest.mock("@sps/broadcast/models/message/sdk/server", () => ({
  api: {
    delete: (...args: unknown[]) => mockMessageDelete(...args),
  },
}));

jest.mock("node:dns/promises", () => ({
  lookup: jest.fn(),
}));

import { Hono } from "hono";
import { lookup } from "node:dns/promises";
import { Middleware } from "./index";

const mockLookup = lookup as unknown as jest.Mock;
const originalFetch = globalThis.fetch;
let mockFetch: jest.Mock;

function createMessage(pipeUrl: string) {
  return {
    id: "message-1",
    payload: JSON.stringify({
      trigger: {
        type: "request",
        method: "PATCH",
        url: "http://api:4000/api/ecommerce/orders/order-1",
      },
      pipe: [
        {
          type: "request",
          method: "POST",
          url: pipeUrl,
          headers: { "X-RBAC-SECRET-KEY": "operator-secret" },
        },
      ],
    }),
  };
}

async function runPipeline(pipeUrl: string) {
  const message = createMessage(pipeUrl);

  await new Middleware().executePipeline({
    message: message as any,
    pipe: JSON.parse(message.payload).pipe,
    index: 0,
    triggerResult: null,
  });
}

async function flushPipeline() {
  for (let tick = 0; tick < 20; tick++) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

beforeEach(() => {
  jest.clearAllMocks();
  mockLookup.mockReset();
  mockMessageDelete.mockResolvedValue({ id: "message-1" });
  mockFetch = jest.fn();
  globalThis.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("Given: checkout stored a pipeline step on the API's own origin", () => {
  /**
   * BDD Scenario: the order update triggers the subject check.
   *
   * Given: an observer message whose trigger is PATCH on the order and whose
   *        step is POST on the subject check under http://api:4000.
   * When: the order update succeeds through the middleware.
   * Then: the step is sent to that URL by name with the operator header, and
   *       the message is deleted after the 2xx answer.
   */
  it("sends the step and clears the message", async () => {
    mockChannelFind.mockResolvedValue([{ id: "channel-1" }]);
    mockChannelMessageFind.mockResolvedValue([
      createMessage("http://api:4000/api/rbac/subjects/subject-1/check"),
    ]);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "subject-1" } }), {
        status: 201,
      }),
    );

    const app = new Hono();
    app.use(new Middleware().init());
    app.patch("/api/ecommerce/orders/:id", (c) =>
      c.json({ data: { id: c.req.param("id") } }),
    );

    const response = await app.request("/api/ecommerce/orders/order-1", {
      method: "PATCH",
    });
    await flushPipeline();

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0];

    expect(String(url)).toBe(
      "http://api:4000/api/rbac/subjects/subject-1/check",
    );
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("x-rbac-secret-key")).toBe(
      "operator-secret",
    );
    expect(mockLookup).not.toHaveBeenCalled();
    expect(mockMessageDelete).toHaveBeenCalledWith(
      expect.objectContaining({ id: "message-1" }),
    );
  });
});

describe("Given: a stored pipeline step names a non-public address", () => {
  /**
   * BDD Scenario: a step aimed at the cloud metadata address.
   *
   * Given: a pipeline step whose URL is the metadata address.
   * When: the pipeline runs.
   * Then: nothing is sent, the message stays, and the refusal is logged.
   */
  it("does not send a step to the metadata address", async () => {
    await runPipeline("http://169.254.169.254/latest/meta-data/");

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockMessageDelete).not.toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "Validation error. Outbound URL must resolve to public addresses only",
      }),
    );
  });

  /**
   * BDD Scenario: a step aimed at an internal service name.
   *
   * Given: a pipeline step whose host resolves to an overlay-network address
   *        and is not a listed origin.
   * When: the pipeline runs.
   * Then: nothing is sent and the message stays.
   */
  it("does not send a step to an internal service name", async () => {
    mockLookup.mockResolvedValue([{ address: "10.0.2.9", family: 4 }]);

    await runPipeline("http://redis:6379/");

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockMessageDelete).not.toHaveBeenCalled();
  });
});
