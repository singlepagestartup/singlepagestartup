import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import Ajv from "ajv";

export const SINGLEPAGESTARTUP_MCP_SERVER_ID = "singlepagestartup" as const;
export const SINGLEPAGESTARTUP_MCP_TOOL_TIMEOUT_MS = 30_000;
export const SINGLEPAGESTARTUP_MCP_RESULT_LIMIT_BYTES = 32 * 1024;
export const SINGLEPAGESTARTUP_MCP_RBAC_SUBJECT_TOKEN_EXCHANGE_PATH =
  "/internal/rbac-subject-token-exchange";

export interface IMcpToolDefinition {
  name: string;
  title?: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export interface INormalizedMcpToolResult {
  isError: boolean;
  text: string;
  structuredContent?: Record<string, unknown>;
}

interface IMcpListToolsResult {
  tools: IMcpToolDefinition[];
  nextCursor?: string;
}

interface IMcpWireClient {
  listTools(
    params?: { cursor?: string },
    options?: {
      signal?: AbortSignal;
      timeout?: number;
      maxTotalTimeout?: number;
    },
  ): Promise<IMcpListToolsResult>;
  callTool(
    params: { name: string; arguments?: Record<string, unknown> },
    resultSchema?: unknown,
    options?: {
      signal?: AbortSignal;
      timeout?: number;
      maxTotalTimeout?: number;
    },
  ): Promise<unknown>;
  close(): Promise<void>;
}

export interface ISinglePageStartupMcpSession {
  readonly serverId: typeof SINGLEPAGESTARTUP_MCP_SERVER_ID;
  listTools(): Promise<IMcpToolDefinition[]>;
  callTool(props: {
    name: string;
    arguments?: Record<string, unknown>;
  }): Promise<INormalizedMcpToolResult>;
  close(): Promise<void>;
}

export interface ISinglePageStartupMcpClientDependencies {
  fetch?: typeof fetch;
  mcpUrl?: string;
  exchangeSecret?: string;
  createWireClient?: (props: {
    mcpUrl: string;
    accessToken: string;
  }) => Promise<IMcpWireClient>;
  toolTimeoutMs?: number;
  resultLimitBytes?: number;
}

interface IRbacSubjectTokenExchangeResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export class SinglePageStartupMcpClientService {
  private readonly fetchImplementation: typeof fetch;
  private readonly mcpUrl: string;
  private readonly exchangeSecret: string;
  private readonly createWireClient: NonNullable<
    ISinglePageStartupMcpClientDependencies["createWireClient"]
  >;
  private readonly toolTimeoutMs: number;
  private readonly resultLimitBytes: number;

  constructor(dependencies: ISinglePageStartupMcpClientDependencies = {}) {
    this.fetchImplementation = dependencies.fetch ?? fetch;
    this.mcpUrl =
      dependencies.mcpUrl ??
      process.env["MCP_SERVICE_URL"] ??
      "http://127.0.0.1:3001/mcp";
    this.exchangeSecret =
      dependencies.exchangeSecret ??
      process.env["MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET"] ??
      "";
    this.createWireClient =
      dependencies.createWireClient ?? createSdkWireClient;
    this.toolTimeoutMs =
      dependencies.toolTimeoutMs ?? SINGLEPAGESTARTUP_MCP_TOOL_TIMEOUT_MS;
    this.resultLimitBytes =
      dependencies.resultLimitBytes ?? SINGLEPAGESTARTUP_MCP_RESULT_LIMIT_BYTES;
  }

  async openSession(props: {
    rbacSubjectAuthenticationJwt: string;
  }): Promise<ISinglePageStartupMcpSession> {
    if (!props.rbacSubjectAuthenticationJwt) {
      throw new Error(
        "Authorization error. RBAC subject authentication JWT is required",
      );
    }

    if (!this.exchangeSecret) {
      throw new Error(
        "Configuration error. MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET is required",
      );
    }

    const accessToken = await this.exchangeRbacSubjectAuthenticationJwt(
      props.rbacSubjectAuthenticationJwt,
    );
    const wireClient = await this.createWireClient({
      mcpUrl: this.mcpUrl,
      accessToken,
    });

    return new SinglePageStartupMcpSession({
      wireClient,
      toolTimeoutMs: this.toolTimeoutMs,
      resultLimitBytes: this.resultLimitBytes,
    });
  }

  private async exchangeRbacSubjectAuthenticationJwt(
    rbacSubjectAuthenticationJwt: string,
  ) {
    const exchangeUrl = new URL(
      SINGLEPAGESTARTUP_MCP_RBAC_SUBJECT_TOKEN_EXCHANGE_PATH,
      this.mcpUrl,
    );
    const response = await this.fetchImplementation(exchangeUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-mcp-internal-token-exchange-secret": this.exchangeSecret,
      },
      body: JSON.stringify({
        subject_token: rbacSubjectAuthenticationJwt,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(
        `MCP rbac.subject token exchange failed (${response.status}): ${details}`,
      );
    }

    const payload =
      (await response.json()) as Partial<IRbacSubjectTokenExchangeResponse>;

    if (
      typeof payload.access_token !== "string" ||
      !payload.access_token ||
      payload.token_type !== "Bearer"
    ) {
      throw new Error(
        "MCP rbac.subject token exchange returned an invalid token",
      );
    }

    return payload.access_token;
  }
}

class SinglePageStartupMcpSession implements ISinglePageStartupMcpSession {
  readonly serverId = SINGLEPAGESTARTUP_MCP_SERVER_ID;
  private readonly wireClient: IMcpWireClient;
  private readonly toolTimeoutMs: number;
  private readonly resultLimitBytes: number;
  private readonly ajv = new Ajv({ allErrors: true, strictDefaults: true });
  private tools?: IMcpToolDefinition[];
  private closed = false;

  constructor(props: {
    wireClient: IMcpWireClient;
    toolTimeoutMs: number;
    resultLimitBytes: number;
  }) {
    this.wireClient = props.wireClient;
    this.toolTimeoutMs = props.toolTimeoutMs;
    this.resultLimitBytes = props.resultLimitBytes;
  }

  async listTools(): Promise<IMcpToolDefinition[]> {
    this.assertOpen();

    const tools: IMcpToolDefinition[] = [];
    let cursor: string | undefined;

    do {
      const result = await this.wireClient.listTools(
        cursor ? { cursor } : undefined,
        {
          timeout: this.toolTimeoutMs,
          maxTotalTimeout: this.toolTimeoutMs,
        },
      );
      tools.push(...result.tools);
      cursor = result.nextCursor;
    } while (cursor);

    this.tools = tools;

    return tools;
  }

  async callTool(props: {
    name: string;
    arguments?: Record<string, unknown>;
  }): Promise<INormalizedMcpToolResult> {
    this.assertOpen();
    const tools = this.tools ?? (await this.listTools());
    const tool = tools.find((candidate) => candidate.name === props.name);

    if (!tool) {
      throw new Error(
        `Validation error. Tool ${props.name} is not present in the live SinglePageStartup MCP catalog`,
      );
    }

    this.assertArguments(tool, props.arguments ?? {});

    const abortController = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      const result = await Promise.race([
        this.wireClient.callTool(
          {
            name: tool.name,
            arguments: props.arguments ?? {},
          },
          undefined,
          {
            signal: abortController.signal,
            timeout: this.toolTimeoutMs,
            maxTotalTimeout: this.toolTimeoutMs,
          },
        ),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => {
            abortController.abort();
            reject(
              new Error(
                `MCP tool call timed out after ${this.toolTimeoutMs}ms`,
              ),
            );
          }, this.toolTimeoutMs);
        }),
      ]);
      const normalized = normalizeMcpToolResult(result);
      const resultSize = Buffer.byteLength(JSON.stringify(normalized), "utf8");

      if (resultSize > this.resultLimitBytes) {
        throw new Error(
          `MCP tool result exceeds ${this.resultLimitBytes} byte limit`,
        );
      }

      return normalized;
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }

  async close(): Promise<void> {
    if (this.closed) {
      return;
    }

    this.closed = true;
    await this.wireClient.close();
  }

  private assertOpen() {
    if (this.closed) {
      throw new Error("MCP session is closed");
    }
  }

  private assertArguments(
    tool: IMcpToolDefinition,
    args: Record<string, unknown>,
  ) {
    let validate: ReturnType<typeof this.ajv.compile>;

    try {
      validate = this.ajv.compile(tool.inputSchema);
    } catch (error) {
      throw new Error(
        `Invalid MCP input schema for ${tool.name}: ${toErrorMessage(error)}`,
      );
    }

    if (!validate(args)) {
      throw new Error(
        `Validation error. Arguments do not match ${tool.name}: ${this.ajv.errorsText(
          validate.errors,
        )}`,
      );
    }
  }
}

async function createSdkWireClient(props: {
  mcpUrl: string;
  accessToken: string;
}): Promise<IMcpWireClient> {
  const client = new Client({
    name: "singlepagestartup-rbac-subject",
    version: "1.0.0",
  });
  const transport = new StreamableHTTPClientTransport(new URL(props.mcpUrl), {
    requestInit: {
      headers: {
        authorization: `Bearer ${props.accessToken}`,
      },
    },
  });

  try {
    await client.connect(transport);
  } catch (error) {
    await client.close().catch(() => undefined);
    throw error;
  }

  return {
    listTools: (params, options) => client.listTools(params, options),
    callTool: (params, _resultSchema, options) =>
      client.callTool(params, undefined, options),
    close: async () => {
      try {
        if (transport.sessionId) {
          await transport.terminateSession();
        }
      } finally {
        await client.close();
      }
    },
  };
}

function normalizeMcpToolResult(result: unknown): INormalizedMcpToolResult {
  if (!isRecord(result)) {
    throw new Error("MCP tool returned an invalid protocol result");
  }

  if ("toolResult" in result) {
    return {
      isError: false,
      text: stringifyUnknown(result.toolResult),
    };
  }

  if (!Array.isArray(result.content)) {
    throw new Error("MCP tool result does not include content");
  }

  const text = result.content
    .map((item) => {
      if (
        isRecord(item) &&
        item.type === "text" &&
        typeof item.text === "string"
      ) {
        return item.text;
      }

      return stringifyUnknown(item);
    })
    .join("\n");

  return {
    isError: result.isError === true,
    text,
    ...(isRecord(result.structuredContent)
      ? { structuredContent: result.structuredContent }
      : {}),
  };
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringifyUnknown(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
