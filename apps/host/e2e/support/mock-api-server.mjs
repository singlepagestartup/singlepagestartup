import { createServer } from "node:http";
import { URL } from "node:url";

const HOST = "127.0.0.1";
const PORT = 4000;

function json(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers":
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Set-Cookie, Authorization",
  });
  res.end(JSON.stringify(payload));
}

function normalizePath(pathname) {
  return pathname.replace(/\/+$/, "") || "/";
}

function makePage(url) {
  return {
    id: `mock-page:${url}`,
    variant: "default",
    url,
    urls: [{ url }],
  };
}

const server = createServer((req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${HOST}:${PORT}`);
  const method = req.method || "GET";
  const path = normalizePath(requestUrl.pathname);

  if (method === "OPTIONS") {
    return json(res, 204, {});
  }

  if (path === "/healthz") {
    return json(res, 200, { status: "ok" });
  }

  if (path === "/api/host/pages/urls" && method === "GET") {
    return json(res, 200, { data: { urls: [{ url: "/" }, { url: "/admin" }] } });
  }

  if (path === "/api/host/pages/find-by-url" && method === "GET") {
    const url = requestUrl.searchParams.get("url") || "/";
    return json(res, 200, { data: makePage(url) });
  }

  if (path === "/api/host/pages/url-segment-value" && method === "GET") {
    return json(res, 200, { data: "" });
  }

  if (path === "/api/host/metadata" && method === "GET") {
    return json(res, 200, {
      data: [
        {
          id: "mock-metadata-primary",
          variant: "primary",
          title: "Mock Host",
          description: "Mock Host Metadata",
          keywords: "mock,host,metadata",
        },
      ],
    });
  }

  return json(res, 200, { data: [] });
});

server.listen(PORT, HOST, () => {
  console.log(`[mock-api] listening on http://${HOST}:${PORT}`);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
