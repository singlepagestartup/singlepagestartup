import "./env";
import { randomUUID } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "./actions.js";
import {
  installMcpFetchAuthForwarding,
  runWithMcpRequestAuthContext,
} from "./lib/auth-context.js";
import { getOAuthAuthenticationPage } from "./lib/oauth-authentication-page.js";
import {
  getMcpPublicUrl,
  getProtectedResourceMetadata,
  getWwwAuthenticateHeader,
  handleOAuthRequest,
  isOAuthRoute,
  verifyMcpAccessToken,
} from "./lib/oauth.js";

type IHttpMcpSession = {
  transport: StreamableHTTPServerTransport;
};

const sessions = new Map<string, IHttpMcpSession>();
const host = process.env["MCP_HTTP_HOST"] || "127.0.0.1";
const port = Number(process.env["MCP_HTTP_PORT"] || 3001);

installMcpFetchAuthForwarding();

const server = createServer(async (req, res) => {
  try {
    const url = getRequestUrl(req);

    setCorsHeaders(req, res);

    if (req.method === "OPTIONS") {
      return sendOptions(res);
    }

    if (url.pathname === "/authentication/oauth") {
      return sendHtml(res, 200, getOAuthAuthenticationPage());
    }

    if (isOAuthRoute(url.pathname)) {
      return handleOAuthRequest(req, res, url);
    }

    if (url.pathname !== "/mcp") {
      return sendJson(res, 404, { error: "not_found" });
    }

    if (!isAllowedOrigin(req)) {
      return sendJson(res, 403, { error: "invalid_origin" });
    }

    const requestAuth = await getRequestAuth(req);

    if (!requestAuth.ok) {
      return sendUnauthorized(res, requestAuth.message);
    }

    const sessionId = getHeader(req, "mcp-session-id");
    const existingSession = sessionId ? sessions.get(sessionId) : undefined;
    const parsedBody =
      req.method === "POST" ? await readJsonBody(req, res) : undefined;

    if (req.method === "POST" && parsedBody === undefined) {
      return;
    }

    if (sessionId && !existingSession) {
      return sendJson(res, 404, {
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: "Session not found",
        },
        id: null,
      });
    }

    const session =
      existingSession ||
      (req.method === "POST" && isInitializeRequest(parsedBody)
        ? await createHttpSession()
        : undefined);

    if (!session) {
      return sendJson(res, 400, {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Invalid or missing MCP session ID",
        },
        id: null,
      });
    }

    const authInfo: AuthInfo = {
      token: requestAuth.token,
      clientId: requestAuth.clientId,
      scopes: requestAuth.scopes,
      expiresAt: requestAuth.expiresAt,
      resource: new URL(getMcpPublicUrl()),
      extra: {
        subject: requestAuth.subject,
      },
    };
    const authenticatedReq = req as IncomingMessage & { auth?: AuthInfo };
    authenticatedReq.auth = authInfo;

    await runWithMcpRequestAuthContext(
      {
        authorization: requestAuth.authorization,
        rbacSecretKey: requestAuth.rbacSecretKey,
        clientId: requestAuth.clientId,
        scopes: requestAuth.scopes,
        expiresAt: requestAuth.expiresAt,
      },
      () => session.transport.handleRequest(authenticatedReq, res, parsedBody),
    );
  } catch (error) {
    console.error("MCP HTTP error:", error);

    if (!res.headersSent) {
      sendJson(res, 500, { error: "server_error" });
    } else {
      res.end();
    }
  }
});

server.listen(port, host, () => {
  const publicUrl = getMcpPublicUrl();
  console.log(
    `MCP Streamable HTTP server listening on http://${host}:${port}/mcp`,
  );
  console.log(`MCP public resource URL: ${publicUrl}`);
  console.log(
    "MCP protected resource metadata:",
    getProtectedResourceMetadata(),
  );
});

async function createHttpSession(): Promise<IHttpMcpSession> {
  const mcp = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      sessions.set(sessionId, { transport });
    },
    onsessionclosed: (sessionId) => {
      sessions.delete(sessionId);
    },
  });

  transport.onclose = () => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
    }
  };
  transport.onerror = (error) => {
    console.error("MCP transport error:", error);
  };

  await mcp.connect(transport);

  return { transport };
}

async function getRequestAuth(req: IncomingMessage): Promise<
  | {
      ok: true;
      token: string;
      clientId: string;
      scopes: string[];
      expiresAt?: number;
      subject?: string;
      authorization?: string;
      rbacSecretKey?: string;
    }
  | { ok: false; message: string }
> {
  if (process.env["MCP_AUTH_REQUIRED"] === "false") {
    return {
      ok: true,
      token: "anonymous",
      clientId: "anonymous",
      scopes: ["mcp:content"],
    };
  }

  const authorization = getHeader(req, "authorization");
  const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (bearerToken) {
    try {
      const verified = await verifyMcpAccessToken(bearerToken);

      return {
        ok: true,
        token: verified.token,
        clientId: verified.clientId,
        scopes: verified.scopes,
        expiresAt: verified.expiresAt,
        subject: verified.subject,
        authorization: `Bearer ${verified.spsJwt}`,
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Invalid token",
      };
    }
  }

  if (process.env["MCP_ALLOW_RBAC_SECRET_FALLBACK"] === "true") {
    const providedSecret = getHeader(req, "x-rbac-secret-key");

    if (providedSecret && providedSecret === process.env["RBAC_SECRET_KEY"]) {
      return {
        ok: true,
        token: "rbac-secret-key",
        clientId: "rbac-secret-key",
        scopes: ["mcp:content"],
        rbacSecretKey: providedSecret,
      };
    }
  }

  return {
    ok: false,
    message:
      process.env["MCP_ALLOW_RBAC_SECRET_FALLBACK"] === "true"
        ? "Authentication error. Provide Authorization: Bearer <mcp_access_token> or X-RBAC-SECRET-KEY"
        : "Authentication error. Provide Authorization: Bearer <mcp_access_token>",
  };
}

function isAllowedOrigin(req: IncomingMessage) {
  const origin = getHeader(req, "origin");

  if (!origin) {
    return true;
  }

  const allowedOrigins = (process.env["MCP_ALLOWED_ORIGINS"] || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!allowedOrigins.length) {
    return true;
  }

  return allowedOrigins.includes(origin);
}

function getRequestUrl(req: IncomingMessage) {
  const hostHeader = req.headers.host || `${host}:${port}`;

  return new URL(req.url || "/", `http://${hostHeader}`);
}

async function readJsonBody(req: IncomingMessage, res: ServerResponse) {
  const chunks: Buffer[] = [];

  try {
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const raw = Buffer.concat(chunks).toString("utf8");

    return JSON.parse(raw) as unknown;
  } catch (error) {
    sendJson(res, 400, {
      jsonrpc: "2.0",
      error: {
        code: -32700,
        message: error instanceof Error ? error.message : "Parse error",
      },
      id: null,
    });

    return undefined;
  }
}

function getHeader(req: IncomingMessage, name: string) {
  const value = req.headers[name.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function sendOptions(res: ServerResponse) {
  res.statusCode = 204;
  res.end();
}

function setCorsHeaders(req: IncomingMessage, res: ServerResponse) {
  const origin = getHeader(req, "origin");

  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    [
      "Accept",
      "Authorization",
      "Content-Type",
      "Last-Event-ID",
      "Mcp-Session-Id",
      "MCP-Protocol-Version",
      "X-RBAC-SECRET-KEY",
      "x-custom-auth-headers",
    ].join(","),
  );
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Mcp-Session-Id,MCP-Protocol-Version,WWW-Authenticate",
  );
}

function sendUnauthorized(res: ServerResponse, message: string) {
  res.statusCode = 401;
  res.setHeader("WWW-Authenticate", getWwwAuthenticateHeader());
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      error: "unauthorized",
      error_description: message,
    }),
  );
}

function sendHtml(res: ServerResponse, status: number, body: string) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(body);
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
