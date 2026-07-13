/**
 * BDD Suite: employee-authenticated project MCP client.
 *
 * Given: an employee SPS JWT and the internal project MCP endpoint.
 * When: RBAC opens a Streamable HTTP session and executes live-catalog tools.
 * Then: credentials, schemas, bounds, and session ownership are enforced locally.
 */

import {
  PROJECT_MCP_EXCHANGE_PATH,
  ProjectMcpClientService,
} from "./project-mcp-client";

function createTool(overrides: Record<string, unknown> = {}) {
  return {
    name: "model-find",
    description: "Find model records",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string" },
      },
      required: ["model"],
      additionalProperties: false,
    },
    ...overrides,
  };
}

function createHarness(
  props: {
    callTool?: jest.Mock;
    listTools?: jest.Mock;
    resultLimitBytes?: number;
    toolTimeoutMs?: number;
  } = {},
) {
  const fetchImplementation = jest.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        access_token: "mcp-access-token",
        token_type: "Bearer",
        expires_in: 300,
        scope: "mcp:content",
      }),
      { status: 200 },
    ),
  );
  const wireClient = {
    listTools:
      props.listTools ?? jest.fn().mockResolvedValue({ tools: [createTool()] }),
    callTool:
      props.callTool ??
      jest.fn().mockResolvedValue({
        content: [{ type: "text", text: '{"ok":true}' }],
      }),
    close: jest.fn().mockResolvedValue(undefined),
  };
  const createWireClient = jest.fn().mockResolvedValue(wireClient);
  const service = new ProjectMcpClientService({
    fetch: fetchImplementation,
    mcpUrl: "https://mcp.example.com/mcp",
    exchangeSecret: "internal-secret",
    createWireClient,
    resultLimitBytes: props.resultLimitBytes,
    toolTimeoutMs: props.toolTimeoutMs,
  });

  return { service, fetchImplementation, createWireClient, wireClient };
}

describe("employee-authenticated project MCP client", () => {
  /**
   * BDD Scenario: employee token exchange and one reusable session.
   *
   * Given: a server-signed employee SPS JWT.
   * When: the project MCP session is opened and used twice.
   * Then: the dedicated exchange secret and returned bearer are used without RBAC bypass headers.
   */
  it("exchanges the employee JWT and reuses one MCP session", async () => {
    const harness = createHarness();
    const session = await harness.service.openSession({
      employeeSpsJwt: "employee-sps-jwt",
    });

    await session.listTools();
    await session.callTool({
      name: "model-find",
      arguments: { model: "social.profiles" },
    });
    await session.close();

    expect(harness.fetchImplementation).toHaveBeenCalledWith(
      new URL(`https://mcp.example.com${PROJECT_MCP_EXCHANGE_PATH}`),
      expect.objectContaining({
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-mcp-internal-token-exchange-secret": "internal-secret",
        },
        body: JSON.stringify({ subject_token: "employee-sps-jwt" }),
      }),
    );
    const exchangeHeaders = harness.fetchImplementation.mock.calls[0][1]
      .headers as Record<string, string>;
    expect(exchangeHeaders).not.toHaveProperty("X-RBAC-SECRET-KEY");
    expect(exchangeHeaders).not.toHaveProperty("x-rbac-secret-key");
    expect(harness.createWireClient).toHaveBeenCalledWith({
      mcpUrl: "https://mcp.example.com/mcp",
      accessToken: "mcp-access-token",
    });
    expect(harness.wireClient.callTool).toHaveBeenCalledWith(
      {
        name: "model-find",
        arguments: { model: "social.profiles" },
      },
      undefined,
      expect.objectContaining({
        timeout: 30_000,
        maxTotalTimeout: 30_000,
      }),
    );
    expect(harness.wireClient.close).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: live catalog and schema validation.
   *
   * Given: the MCP server lists one tool with a JSON input schema.
   * When: an absent tool or invalid arguments are requested.
   * Then: dispatch is rejected before the MCP tool call.
   */
  it("rejects names and arguments outside the live MCP catalog", async () => {
    const harness = createHarness();
    const session = await harness.service.openSession({
      employeeSpsJwt: "employee-sps-jwt",
    });

    await session.listTools();
    await expect(
      session.callTool({ name: "model-delete", arguments: {} }),
    ).rejects.toThrow("not present in the live project MCP catalog");
    await expect(
      session.callTool({ name: "model-find", arguments: {} }),
    ).rejects.toThrow("Arguments do not match model-find");
    expect(harness.wireClient.callTool).not.toHaveBeenCalled();
    await session.close();
  });

  /**
   * BDD Scenario: result size boundary.
   *
   * Given: an MCP tool returns more than the configured serialized-result limit.
   * When: RBAC normalizes the result.
   * Then: oversized protocol data is rejected before it reaches OpenRouter.
   */
  it("rejects oversized normalized MCP results", async () => {
    const harness = createHarness({
      resultLimitBytes: 64,
      callTool: jest.fn().mockResolvedValue({
        content: [{ type: "text", text: "x".repeat(100) }],
      }),
    });
    const session = await harness.service.openSession({
      employeeSpsJwt: "employee-sps-jwt",
    });

    await expect(
      session.callTool({
        name: "model-find",
        arguments: { model: "social.profiles" },
      }),
    ).rejects.toThrow("exceeds 64 byte limit");
    await session.close();
  });

  /**
   * BDD Scenario: bounded tool timeout.
   *
   * Given: an MCP tool never settles.
   * When: the per-call timeout elapses.
   * Then: the request is aborted and reported as a bounded failure.
   */
  it("aborts a tool call at the configured timeout", async () => {
    jest.useFakeTimers();
    const harness = createHarness({
      toolTimeoutMs: 25,
      callTool: jest.fn().mockImplementation(() => new Promise(() => {})),
    });
    const session = await harness.service.openSession({
      employeeSpsJwt: "employee-sps-jwt",
    });
    const call = session.callTool({
      name: "model-find",
      arguments: { model: "social.profiles" },
    });
    const rejection = expect(call).rejects.toThrow("timed out after 25ms");

    await jest.advanceTimersByTimeAsync(25);
    await rejection;
    const requestOptions = harness.wireClient.callTool.mock.calls[0][2];
    expect(requestOptions.signal.aborted).toBe(true);
    await session.close();
    jest.useRealTimers();
  });

  /**
   * BDD Scenario: protocol errors and cleanup.
   *
   * Given: the MCP server rejects a tool call.
   * When: the caller closes the turn session in a finally path.
   * Then: the protocol error is preserved and the session is closed once.
   */
  it("preserves protocol failures and supports idempotent cleanup", async () => {
    const harness = createHarness({
      callTool: jest.fn().mockRejectedValue(new Error("JSON-RPC failure")),
    });
    const session = await harness.service.openSession({
      employeeSpsJwt: "employee-sps-jwt",
    });

    await expect(
      session.callTool({
        name: "model-find",
        arguments: { model: "social.profiles" },
      }),
    ).rejects.toThrow("JSON-RPC failure");
    await session.close();
    await session.close();
    expect(harness.wireClient.close).toHaveBeenCalledTimes(1);
  });
});
