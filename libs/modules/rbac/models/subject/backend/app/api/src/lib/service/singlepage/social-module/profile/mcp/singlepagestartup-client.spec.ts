/**
 * BDD Suite: rbac.subject-authenticated SinglePageStartup MCP client.
 *
 * Given: an RBAC subject authentication JWT and the internal SinglePageStartup MCP endpoint.
 * When: RBAC opens a Streamable HTTP session and executes live-catalog tools.
 * Then: credentials, schemas, bounds, and session ownership are enforced locally.
 */

import {
  SINGLEPAGESTARTUP_MCP_RBAC_SUBJECT_TOKEN_EXCHANGE_PATH,
  SinglePageStartupMcpClientService,
} from "./singlepagestartup-client";

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
  const service = new SinglePageStartupMcpClientService({
    fetch: fetchImplementation,
    mcpUrl: "https://mcp.example.com/mcp",
    exchangeSecret: "internal-secret",
    createWireClient,
    resultLimitBytes: props.resultLimitBytes,
    toolTimeoutMs: props.toolTimeoutMs,
  });

  return { service, fetchImplementation, createWireClient, wireClient };
}

describe("rbac.subject-authenticated SinglePageStartup MCP client", () => {
  /**
   * BDD Scenario: canonical MCP service environment contract.
   *
   * Given: apps.api receives the service URL and exchange secret through MCP_SERVICE variables.
   * When: the MCP client is created without dependency overrides.
   * Then: it exchanges the rbac.subject token against that service URL with that secret.
   */
  it("reads the canonical MCP service environment variables", async () => {
    const originalUrl = process.env["MCP_SERVICE_URL"];
    const originalSecret =
      process.env["MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET"];
    const fetchImplementation = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: "environment-mcp-access-token",
          token_type: "Bearer",
          expires_in: 300,
          scope: "mcp:content",
        }),
        { status: 200 },
      ),
    );
    const wireClient = {
      listTools: jest.fn().mockResolvedValue({ tools: [] }),
      callTool: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };
    const createWireClient = jest.fn().mockResolvedValue(wireClient);

    process.env["MCP_SERVICE_URL"] = "https://internal-mcp.example/mcp";
    process.env["MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET"] =
      "environment-exchange-secret";

    try {
      const service = new SinglePageStartupMcpClientService({
        fetch: fetchImplementation,
        createWireClient,
      });
      const session = await service.openSession({
        rbacSubjectAuthenticationJwt: "rbac-subject-authentication-jwt",
      });

      expect(fetchImplementation).toHaveBeenCalledWith(
        new URL(
          `https://internal-mcp.example${SINGLEPAGESTARTUP_MCP_RBAC_SUBJECT_TOKEN_EXCHANGE_PATH}`,
        ),
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-mcp-internal-token-exchange-secret":
              "environment-exchange-secret",
          }),
        }),
      );
      expect(createWireClient).toHaveBeenCalledWith({
        mcpUrl: "https://internal-mcp.example/mcp",
        accessToken: "environment-mcp-access-token",
      });

      await session.close();
    } finally {
      if (originalUrl === undefined) {
        delete process.env["MCP_SERVICE_URL"];
      } else {
        process.env["MCP_SERVICE_URL"] = originalUrl;
      }
      if (originalSecret === undefined) {
        delete process.env["MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET"];
      } else {
        process.env["MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET"] =
          originalSecret;
      }
    }
  });

  /**
   * BDD Scenario: rbac.subject token exchange and one reusable session.
   *
   * Given: a server-signed RBAC subject authentication JWT.
   * When: the SinglePageStartup MCP session is opened and used twice.
   * Then: the dedicated exchange secret and returned bearer are used without RBAC bypass headers.
   */
  it("exchanges the rbac.subject authentication JWT and reuses one MCP session", async () => {
    const harness = createHarness();
    const session = await harness.service.openSession({
      rbacSubjectAuthenticationJwt: "rbac-subject-authentication-jwt",
    });

    await session.listTools();
    await session.callTool({
      name: "model-find",
      arguments: { model: "social.profiles" },
    });
    await session.close();

    expect(harness.fetchImplementation).toHaveBeenCalledWith(
      new URL(
        `https://mcp.example.com${SINGLEPAGESTARTUP_MCP_RBAC_SUBJECT_TOKEN_EXCHANGE_PATH}`,
      ),
      expect.objectContaining({
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-mcp-internal-token-exchange-secret": "internal-secret",
        },
        body: JSON.stringify({
          subject_token: "rbac-subject-authentication-jwt",
        }),
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
      rbacSubjectAuthenticationJwt: "rbac-subject-authentication-jwt",
    });

    await session.listTools();
    await expect(
      session.callTool({ name: "model-delete", arguments: {} }),
    ).rejects.toThrow("not present in the live SinglePageStartup MCP catalog");
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
      rbacSubjectAuthenticationJwt: "rbac-subject-authentication-jwt",
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
      rbacSubjectAuthenticationJwt: "rbac-subject-authentication-jwt",
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
      rbacSubjectAuthenticationJwt: "rbac-subject-authentication-jwt",
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
