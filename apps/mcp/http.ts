import "./env";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "./actions.js";

const DEFAULT_PORT = 3001;
const DEFAULT_HOST = "127.0.0.1";
const MCP_PATHS = new Set(["/mcp", "/sse"]);
const MAX_BODY_BYTES = 4 * 1024 * 1024;

const port = Number(process.env["MCP_HTTP_PORT"] ?? DEFAULT_PORT);
const host = process.env["MCP_HTTP_HOST"] ?? DEFAULT_HOST;
const transports: Record<string, StreamableHTTPServerTransport> = {};

function firstHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function setCorsHeaders(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    [
      "Authorization",
      "Content-Type",
      "Last-Event-ID",
      "Mcp-Protocol-Version",
      "Mcp-Session-Id",
      "X-RBAC-SECRET-KEY",
      "mcp-protocol-version",
      "mcp-session-id",
    ].join(", "),
  );
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");
}

function writeJsonRpcError(props: {
  res: ServerResponse;
  status: number;
  message: string;
}) {
  if (!props.res.headersSent) {
    props.res.writeHead(props.status, {
      "Content-Type": "application/json",
    });
  }

  props.res.end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: props.message,
      },
      id: null,
    }),
  );
}

function readJsonBody(req: IncomingMessage) {
  return new Promise<unknown>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;

      if (size > MAX_BODY_BYTES) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on("end", () => {
      const rawBody = Buffer.concat(chunks).toString("utf8");

      if (!rawBody) {
        resolve(undefined);
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch {
        reject(new Error("Invalid JSON request body"));
      }
    });

    req.on("error", reject);
  });
}

function createTransport() {
  let transport: StreamableHTTPServerTransport;
  const server = createMcpServer();

  transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    enableDnsRebindingProtection: true,
    allowedHosts: [
      `${host}:${port}`,
      `localhost:${port}`,
      `127.0.0.1:${port}`,
      `[::1]:${port}`,
    ],
    onsessioninitialized: (sessionId) => {
      transports[sessionId] = transport;
    },
  });

  transport.onclose = () => {
    if (transport.sessionId) {
      delete transports[transport.sessionId];
    }

    void server.close();
  };

  transport.onerror = (error) => {
    console.error("MCP HTTP transport error:", error);
  };

  return { server, transport };
}

async function handleMcpRequest(req: IncomingMessage, res: ServerResponse) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(
    req.url ?? "/",
    `http://${req.headers.host ?? "localhost"}`,
  );

  if (!MCP_PATHS.has(url.pathname)) {
    res.writeHead(404, {
      "Content-Type": "text/plain",
    });
    res.end("Not found");
    return;
  }

  try {
    if (req.method === "POST") {
      const body = await readJsonBody(req);
      const sessionId = firstHeaderValue(req.headers["mcp-session-id"]);
      let transport = sessionId ? transports[sessionId] : undefined;

      if (!transport && !sessionId && isInitializeRequest(body)) {
        const created = createTransport();
        transport = created.transport;
        await created.server.connect(transport);
      }

      if (!transport) {
        writeJsonRpcError({
          res,
          status: 400,
          message: "Bad Request: No valid MCP session ID provided",
        });
        return;
      }

      await transport.handleRequest(req, res, body);
      return;
    }

    const sessionId = firstHeaderValue(req.headers["mcp-session-id"]);
    const transport = sessionId ? transports[sessionId] : undefined;

    if (!transport) {
      writeJsonRpcError({
        res,
        status: 400,
        message: "Bad Request: Invalid or missing MCP session ID",
      });
      return;
    }

    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("MCP HTTP request error:", error);

    if (!res.headersSent) {
      writeJsonRpcError({
        res,
        status: 500,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
}

const server = createServer((req, res) => {
  void handleMcpRequest(req, res);
});

server.listen(port, host, () => {
  console.log(
    `MCP Streamable HTTP server listening on http://${host}:${port}/mcp`,
  );
  console.log(
    `MCP Streamable HTTP compatibility endpoint: http://${host}:${port}/sse`,
  );
});
