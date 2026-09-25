/**
 * BDD Suite: agent cron trigger credentials.
 *
 * Given: the agent cron route composed behind its route guard.
 * When: a request arrives with the cron secret, the operator secret, a wrong
 *       value, a secret in the other secret's header, or nothing.
 * Then: the cron secret in X-AGENT-CRON-SECRET and the operator secret in its
 *       header or cookie reach the handler; every other request is refused with
 *       one 401 that names no header, and an unset cron secret opens nothing.
 */

const mockOperatorSecret = "7c41d0e95a2b8f36c1d4e7a09b25f8c3";
const mockCronSecret = "e2b9a4f7c13d6085b7e2a9c4d1f3086b";

let mockRbacSecretKey: string | undefined = mockOperatorSecret;
let mockAgentCronSecret: string | undefined = mockCronSecret;

jest.mock("@sps/shared-utils", () => {
  return {
    get RBAC_SECRET_KEY() {
      return mockRbacSecretKey;
    },
    get AGENT_CRON_SECRET() {
      return mockAgentCronSecret;
    },
  };
});

import { Hono } from "hono";
import { Middleware } from ".";

function createCronRoute() {
  const handler = jest.fn((c: any) => c.json({ data: [] }));
  const hono = new Hono();

  hono.post("/cron", new Middleware().init(), handler);

  return { handler, hono };
}

async function requestCron(headers: Record<string, string> = {}) {
  const { handler, hono } = createCronRoute();
  const response = await hono.request("/cron", { method: "POST", headers });

  return { handler, response };
}

describe("Given: the agent cron route behind its guard", () => {
  beforeEach(() => {
    mockRbacSecretKey = mockOperatorSecret;
    mockAgentCronSecret = mockCronSecret;
  });

  /**
   * BDD Scenario
   * Given: the server crontab sends the configured cron secret.
   * When: the guard evaluates X-AGENT-CRON-SECRET.
   * Then: the cron handler runs.
   */
  it("When: the cron secret arrives in its header Then: the handler runs", async () => {
    const { response, handler } = await requestCron({
      "X-AGENT-CRON-SECRET": mockCronSecret,
    });

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario
   * Given: an operator calls the route with the operator secret.
   * When: the secret arrives in X-RBAC-SECRET-KEY or in the rbac.secret-key cookie.
   * Then: the cron handler runs in both cases.
   */
  it("When: the operator secret arrives in its header or cookie Then: the handler runs", async () => {
    const viaHeader = await requestCron({
      "X-RBAC-SECRET-KEY": mockOperatorSecret,
    });
    const viaCookie = await requestCron({
      Cookie: `rbac.secret-key=${mockOperatorSecret}`,
    });

    expect(viaHeader.response.status).toBe(200);
    expect(viaHeader.handler).toHaveBeenCalledTimes(1);
    expect(viaCookie.response.status).toBe(200);
    expect(viaCookie.handler).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario
   * Given: a request carries no credential.
   * When: the guard evaluates it.
   * Then: it is refused with 401 before the handler runs.
   */
  it("When: no credential is sent Then: the request is refused", async () => {
    const { response, handler } = await requestCron();

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a request carries a cron secret that differs from the configured
   *        one in one byte.
   * When: the guard evaluates it.
   * Then: it is refused with the same response as a request with no credential,
   *       and the response names neither the submitted value nor a header.
   */
  it("When: the cron secret is wrong Then: the refusal matches the one for no credential", async () => {
    const submitted = `${mockCronSecret.slice(0, -1)}0`;
    const wrong = await requestCron({ "X-AGENT-CRON-SECRET": submitted });
    const absent = await requestCron();
    const body = await wrong.response.text();

    expect(submitted).toHaveLength(mockCronSecret.length);
    expect(wrong.response.status).toBe(401);
    expect(body).toBe(await absent.response.text());
    expect(body).not.toContain(submitted);
    expect(body.toLowerCase()).not.toContain("x-agent-cron-secret");
    expect(body.toLowerCase()).not.toContain("x-rbac-secret-key");
    expect(wrong.handler).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: each secret is sent in the other secret's header.
   * When: the guard evaluates the request.
   * Then: both requests are refused, so the cron secret never acts as an
   *       operator credential.
   */
  it("When: a secret arrives in the other secret's header Then: the request is refused", async () => {
    const cronAsOperator = await requestCron({
      "X-RBAC-SECRET-KEY": mockCronSecret,
    });
    const operatorAsCron = await requestCron({
      "X-AGENT-CRON-SECRET": mockOperatorSecret,
    });

    expect(cronAsOperator.response.status).toBe(401);
    expect(cronAsOperator.handler).not.toHaveBeenCalled();
    expect(operatorAsCron.response.status).toBe(401);
    expect(operatorAsCron.handler).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: the deployment configures no cron secret.
   * When: a request carries no credential, an empty cron header or any value.
   * Then: every such request is refused, while the operator secret still opens
   *       the route.
   */
  it("When: no cron secret is configured Then: only the operator secret opens the route", async () => {
    mockAgentCronSecret = undefined;

    const withoutCredential = await requestCron();
    const withEmptyHeader = await requestCron({ "X-AGENT-CRON-SECRET": "" });
    const withAnyValue = await requestCron({
      "X-AGENT-CRON-SECRET": mockCronSecret,
    });
    const asOperator = await requestCron({
      "X-RBAC-SECRET-KEY": mockOperatorSecret,
    });

    expect(withoutCredential.response.status).toBe(401);
    expect(withEmptyHeader.response.status).toBe(401);
    expect(withAnyValue.response.status).toBe(401);
    expect(withoutCredential.handler).not.toHaveBeenCalled();
    expect(withEmptyHeader.handler).not.toHaveBeenCalled();
    expect(withAnyValue.handler).not.toHaveBeenCalled();
    expect(asOperator.response.status).toBe(200);
    expect(asOperator.handler).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario
   * Given: the deployment sets the cron secret to the empty string.
   * When: a request sends an empty cron header.
   * Then: it is refused, so an empty secret opens nothing.
   */
  it("When: the cron secret is configured empty Then: an empty header is refused", async () => {
    mockAgentCronSecret = "";

    const { response, handler } = await requestCron({
      "X-AGENT-CRON-SECRET": "",
    });

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });
});
