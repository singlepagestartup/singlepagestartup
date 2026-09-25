/**
 * BDD Suite: exception filter error bodies and bug reports.
 *
 * Given: an API whose routes fail with 4xx and 5xx errors, running as a
 *        deployment or on a developer machine, with the bug chat configured.
 * When: the shared exception filter answers those failures.
 * Then: every body keeps the message, the status and the request id; the stack
 *       and the cause chain reach only the full mode and the operator; and the
 *       bug report neither delays the response nor repeats within its window.
 */

import { inspect } from "node:util";

const OPERATOR_SECRET = "operator-secret-for-the-exception-filter-spec";
const BOT_TOKEN = "123456:bot-token-for-the-exception-filter-spec";
const BRIEF_BODY_KEYS = ["error", "method", "path", "requestId", "status"];
const FULL_BODY_KEYS = [...BRIEF_BODY_KEYS, "cause", "stack"].sort();

type IManagedEnvKey = "NODE_ENV" | "API_ERROR_DETAILS";

interface IHarnessProps {
  nodeEnv?: string;
  errorDetails?: string;
  bugService?: boolean;
  reportWindowInSeconds?: number;
  sendMessage?: jest.Mock;
}

const originalEnv: Record<IManagedEnvKey, string | undefined> = {
  NODE_ENV: process.env["NODE_ENV"],
  API_ERROR_DETAILS: process.env["API_ERROR_DETAILS"],
};

function setEnv(key: IManagedEnvKey, value?: string) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

/**
 * Imports the filter into a fresh module registry, so its environment
 * constants and its report window start clean for each scenario. Hono is
 * imported from the same registry because its request internals are keyed by
 * a symbol that is not shared across registries.
 */
async function createHarness(props: IHarnessProps = {}) {
  jest.resetModules();
  setEnv("NODE_ENV", props.nodeEnv);
  setEnv("API_ERROR_DETAILS", props.errorDetails);

  const sendMessage = props.sendMessage ?? jest.fn().mockResolvedValue({});

  jest.doMock("grammy", () => {
    return {
      Bot: jest.fn().mockImplementation(() => {
        return { api: { sendMessage } };
      }),
    };
  });

  jest.doMock("@sps/shared-utils", () => {
    return {
      ...jest.requireActual("@sps/shared-utils"),
      RBAC_SECRET_KEY: OPERATOR_SECRET,
      BUG_SERVICE_TELEGRAM_BOT_TOKEN: props.bugService ? BOT_TOKEN : undefined,
      BUG_SERVICE_TELEGRAM_CHAT_ID: props.bugService ? "bug-chat" : undefined,
      BUG_SERVICE_PROJECT: props.bugService ? "spec-project" : undefined,
      BUG_SERVICE_REPORT_WINDOW_IN_SECONDS: props.reportWindowInSeconds ?? 300,
    };
  });

  const { Filter } = await import("./index");
  const { logger } = await import("@sps/backend-utils");
  const { Hono } = await import("hono");
  const { HTTPException } = await import("hono/http-exception");

  const logError = jest
    .spyOn(logger, "error")
    .mockImplementation(() => undefined);
  const filter = new Filter();
  const app = new Hono();

  app.onError((error, c) => filter.catch(error, c));
  app.get("/pages/:id", () => {
    throw new Error("Internal server error: database unavailable");
  });
  app.get("/widgets", () => {
    throw new Error("Internal server error: widget renderer failed");
  });
  app.get("/orders", () => {
    throw new HTTPException(400, {
      message: "Validation error. Unknown filter method 'nope'",
    });
  });

  return { app, logError, sendMessage };
}

async function readBody(response: Response) {
  return (await response.json()) as Record<string, any>;
}

/**
 * Renders the logged arguments the way a console transport prints them,
 * nested error objects included.
 */
function loggedText(logError: jest.SpyInstance) {
  return inspect(logError.mock.calls, { depth: 5 });
}

async function flushReports() {
  await new Promise((resolve) => setImmediate(resolve));
}

afterEach(() => {
  setEnv("NODE_ENV", originalEnv.NODE_ENV);
  setEnv("API_ERROR_DETAILS", originalEnv.API_ERROR_DETAILS);
  jest.dontMock("grammy");
  jest.dontMock("@sps/shared-utils");
  jest.restoreAllMocks();
});

describe("Given: a deployment that sets NODE_ENV=production", () => {
  /**
   * BDD Scenario: a 5xx in production.
   *
   * Given: NODE_ENV=production and no API_ERROR_DETAILS.
   * When: a route fails with an internal error.
   * Then: the body carries the message, status, method, path and request id
   *       and no stack or cause, while the log keeps the stack under the same
   *       request id.
   */
  it("hides the stack and the cause of a 5xx and keeps them in the log", async () => {
    const { app, logError } = await createHarness({ nodeEnv: "production" });

    const response = await app.request("/pages/abc", {
      headers: { "x-request-id": "request-production-500" },
    });
    const body = await readBody(response);

    expect(response.status).toBe(500);
    expect(Object.keys(body).sort()).toEqual(BRIEF_BODY_KEYS);
    expect(body).toMatchObject({
      requestId: "request-production-500",
      method: "GET",
      status: 500,
      error: "Internal server error: database unavailable",
    });

    const [line, record] = logError.mock.calls[0];

    expect(line).toContain("[request-production-500]");
    expect(JSON.parse(record).stack).toContain("database unavailable");
  });

  /**
   * BDD Scenario: a 4xx in production.
   *
   * Given: NODE_ENV=production and no API_ERROR_DETAILS.
   * When: a route rejects the request with a validation error.
   * Then: the mapped status and the message reach the caller without a stack
   *       or a cause.
   */
  it("hides the stack and the cause of a 4xx and keeps the message", async () => {
    const { app } = await createHarness({ nodeEnv: "production" });

    const response = await app.request("/orders");
    const body = await readBody(response);

    expect(response.status).toBe(400);
    expect(Object.keys(body).sort()).toEqual(BRIEF_BODY_KEYS);
    expect(body.error).toBe("Validation error. Unknown filter method 'nope'");
  });

  /**
   * BDD Scenario: the operator asks through the header.
   *
   * Given: NODE_ENV=production.
   * When: the failing request carries the operator secret in
   *       X-RBAC-SECRET-KEY.
   * Then: the body carries the stack and the cause chain.
   */
  it("returns the stack and the cause to a caller presenting the operator secret", async () => {
    const { app } = await createHarness({ nodeEnv: "production" });

    const response = await app.request("/pages/abc", {
      headers: { "X-RBAC-SECRET-KEY": OPERATOR_SECRET },
    });
    const body = await readBody(response);

    expect(Object.keys(body).sort()).toEqual(FULL_BODY_KEYS);
    expect(body.stack).toContain("database unavailable");
    expect(body.cause.at(-1).message).toBe(body.error);
  });

  /**
   * BDD Scenario: the operator asks through the cookie.
   *
   * Given: NODE_ENV=production.
   * When: the failing request carries the operator secret in the
   *       rbac.secret-key cookie, as the admin browser and MCP transport do.
   * Then: the body carries the stack and the cause chain.
   */
  it("returns the stack and the cause when the operator secret comes in the cookie", async () => {
    const { app } = await createHarness({ nodeEnv: "production" });

    const response = await app.request("/orders", {
      headers: { Cookie: `rbac.secret-key=${OPERATOR_SECRET}` },
    });

    expect(Object.keys(await readBody(response)).sort()).toEqual(
      FULL_BODY_KEYS,
    );
  });

  /**
   * BDD Scenario: a caller guesses the secret.
   *
   * Given: NODE_ENV=production.
   * When: the failing request carries a value that is not the operator secret.
   * Then: the body stays brief.
   */
  it("keeps the stack and the cause from a caller presenting a wrong secret", async () => {
    const { app } = await createHarness({ nodeEnv: "production" });

    const response = await app.request("/pages/abc", {
      headers: { "X-RBAC-SECRET-KEY": `${OPERATOR_SECRET}-guess` },
    });

    expect(Object.keys(await readBody(response)).sort()).toEqual(
      BRIEF_BODY_KEYS,
    );
  });

  /**
   * BDD Scenario: a deployment that wants every detail.
   *
   * Given: NODE_ENV=production and API_ERROR_DETAILS=full.
   * When: a route fails.
   * Then: the body carries the stack and the cause chain for every caller.
   */
  it("returns the stack and the cause when API_ERROR_DETAILS=full overrides production", async () => {
    const { app } = await createHarness({
      nodeEnv: "production",
      errorDetails: "full",
    });

    const response = await app.request("/pages/abc");

    expect(Object.keys(await readBody(response)).sort()).toEqual(
      FULL_BODY_KEYS,
    );
  });
});

describe("Given: a deployment that leaves NODE_ENV unset", () => {
  /**
   * BDD Scenario: the deployer's default process environment.
   *
   * Given: neither NODE_ENV nor API_ERROR_DETAILS, as a container started by
   *        the deployer runs.
   * When: a route fails.
   * Then: the body is brief.
   */
  it("answers with the brief body", async () => {
    const { app } = await createHarness();

    const response = await app.request("/pages/abc");

    expect(Object.keys(await readBody(response)).sort()).toEqual(
      BRIEF_BODY_KEYS,
    );
  });
});

describe("Given: a developer machine", () => {
  /**
   * BDD Scenario: a development process.
   *
   * Given: NODE_ENV=development and no API_ERROR_DETAILS.
   * When: a route fails.
   * Then: the body carries the stack and the cause chain.
   */
  it("returns the stack and the cause when NODE_ENV=development", async () => {
    const { app } = await createHarness({ nodeEnv: "development" });

    const response = await app.request("/pages/abc");
    const body = await readBody(response);

    expect(Object.keys(body).sort()).toEqual(FULL_BODY_KEYS);
    expect(body.stack).toContain("database unavailable");
  });

  /**
   * BDD Scenario: the local environment file.
   *
   * Given: NODE_ENV unset and API_ERROR_DETAILS=full, as create_env.sh writes.
   * When: a route fails.
   * Then: the body carries the stack and the cause chain.
   */
  it("returns the stack and the cause when API_ERROR_DETAILS=full", async () => {
    const { app } = await createHarness({ errorDetails: "full" });

    const response = await app.request("/orders");

    expect(Object.keys(await readBody(response)).sort()).toEqual(
      FULL_BODY_KEYS,
    );
  });

  /**
   * BDD Scenario: a developer checks what a deployment will answer.
   *
   * Given: NODE_ENV=development and API_ERROR_DETAILS=brief.
   * When: a route fails.
   * Then: the explicit mode wins and the body is brief.
   */
  it("answers with the brief body when API_ERROR_DETAILS=brief overrides development", async () => {
    const { app } = await createHarness({
      nodeEnv: "development",
      errorDetails: "brief",
    });

    const response = await app.request("/pages/abc");

    expect(Object.keys(await readBody(response)).sort()).toEqual(
      BRIEF_BODY_KEYS,
    );
  });
});

describe("Given: a request that never passed the request-id middleware", () => {
  /**
   * BDD Scenario: no x-request-id header.
   *
   * Given: a failing request without an x-request-id header, as on routes
   *        registered before the middleware or in the Telegram service.
   * When: the filter answers it.
   * Then: the body and the log line share one generated id, so the caller can
   *       find the log record.
   */
  it("answers and logs with one generated request id", async () => {
    const { app, logError } = await createHarness({ nodeEnv: "production" });

    const response = await app.request("/pages/abc");
    const body = await readBody(response);

    expect(body.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(logError.mock.calls[0][0]).toContain(`[${body.requestId}]`);
  });
});

describe("Given: the bug chat is configured", () => {
  /**
   * BDD Scenario: Telegram is slow.
   *
   * Given: a Telegram send that has not settled.
   * When: a route fails with a 5xx.
   * Then: the caller receives the response while the send is still pending.
   */
  it("answers a 5xx before the Telegram send settles", async () => {
    const sendMessage = jest.fn(() => new Promise(() => undefined));
    const { app } = await createHarness({ bugService: true, sendMessage });
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const response = await Promise.race([
      app.request("/pages/abc"),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error("the response waited for the Telegram send"));
        }, 1000);
      }),
    ]).finally(() => clearTimeout(timeout));

    expect(response.status).toBe(500);
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: the report text.
   *
   * Given: a configured bug chat.
   * When: a route fails with a 5xx.
   * Then: the chat receives the project, status, method, URL and message in
   *       the existing HTML format.
   */
  it("sends the report in the existing format", async () => {
    const { app, sendMessage } = await createHarness({ bugService: true });

    await app.request("/pages/abc");
    await flushReports();

    expect(sendMessage).toHaveBeenCalledWith(
      "bug-chat",
      "<b>spec-project</b>\n🚨 <i>500 | GET</i> <pre>http://localhost/pages/abc</pre>\nError: Internal server error: database unavailable",
      { parse_mode: "HTML" },
    );
  });

  /**
   * BDD Scenario: Telegram is unreachable.
   *
   * Given: a send that fails with grammY's network error, whose nested error
   *        names the request URL with the bot token in it.
   * When: a route fails with a 5xx.
   * Then: the caller still gets the response, and the log records the error
   *       message without the token.
   */
  it("logs a failed send by its message and never logs the bot token", async () => {
    const networkError = Object.assign(
      new Error("Network request for 'sendMessage' failed!"),
      {
        error: new Error(
          `request to https://api.telegram.org/bot${BOT_TOKEN}/sendMessage failed`,
        ),
      },
    );
    const sendMessage = jest.fn().mockRejectedValue(networkError);
    const { app, logError } = await createHarness({
      bugService: true,
      sendMessage,
    });

    const response = await app.request("/pages/abc");
    await flushReports();

    expect(response.status).toBe(500);
    expect(logError).toHaveBeenCalledWith(
      "Failed to send error message to Telegram bot:",
      "Network request for 'sendMessage' failed!",
    );
    expect(loggedText(logError)).not.toContain(BOT_TOKEN);
  });

  /**
   * BDD Scenario: a burst of one failure.
   *
   * Given: a configured bug chat and a five-minute window.
   * When: one route fails three times with different ids and query strings.
   * Then: the chat receives one report.
   */
  it("sends one report for repeated failures of one route within the window", async () => {
    const { app, sendMessage } = await createHarness({ bugService: true });

    await app.request("/pages/1");
    await app.request("/pages/2?attempt=2");
    await app.request("/pages/3?attempt=3");
    await flushReports();

    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: two different failures.
   *
   * Given: a configured bug chat.
   * When: two different routes fail.
   * Then: each route is reported once.
   */
  it("reports a failure of another route separately", async () => {
    const { app, sendMessage } = await createHarness({ bugService: true });

    await app.request("/pages/1");
    await app.request("/widgets");
    await flushReports();

    expect(sendMessage).toHaveBeenCalledTimes(2);
  });

  /**
   * BDD Scenario: a failure that persists.
   *
   * Given: a configured bug chat and a sixty-second window.
   * When: one route fails, and fails again after the window has passed.
   * Then: the chat receives a second report.
   */
  it("reports the same route again after the window passes", async () => {
    const startedAt = Date.now();
    const now = jest.spyOn(Date, "now").mockReturnValue(startedAt);
    const { app, sendMessage } = await createHarness({
      bugService: true,
      reportWindowInSeconds: 60,
    });

    await app.request("/pages/1");
    now.mockReturnValue(startedAt + 61_000);
    await app.request("/pages/2");
    await flushReports();

    expect(sendMessage).toHaveBeenCalledTimes(2);
  });

  /**
   * BDD Scenario: a client error.
   *
   * Given: a configured bug chat.
   * When: a route rejects the request with a 4xx.
   * Then: nothing is sent.
   */
  it("never reports a 4xx", async () => {
    const { app, sendMessage } = await createHarness({ bugService: true });

    await app.request("/orders");
    await flushReports();

    expect(sendMessage).not.toHaveBeenCalled();
  });
});
