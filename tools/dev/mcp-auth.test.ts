/**
 * Run with MCP_TEST_REDIS_PORT set to an isolated Redis instance:
 * bun test --no-env-file --timeout 30000 tools/dev/mcp-auth.test.ts
 * Uses real MCP HTTP, Redis and SDK calls to a loopback RBAC fixture.
 * No project data or credentials are used.
 */
import { afterAll, beforeAll, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import { resolve } from "node:path";
import jwt from "jsonwebtoken";
import Redis from "ioredis";

const redisPort = Number(process.env.MCP_TEST_REDIS_PORT);

if (!Number.isSafeInteger(redisPort) || redisPort <= 0) {
  throw new Error(
    "MCP_TEST_REDIS_PORT must name an isolated test Redis instance",
  );
}

const secret = randomBytes(32).toString("hex");
const subjectId = randomUUID();
const refreshTokens = new Set<string>();
let refreshCalls = 0;
let sinkHits = 0;
let apiSawOperatorKey = false;
const sink = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch() {
    sinkHits += 1;
    return new Response("unexpected forwarded request");
  },
});
const rbac = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  async fetch(request) {
    const path = new URL(request.url).pathname;

    if (path.startsWith("/redirect/")) {
      return Response.redirect(sink.url.href, Number(path.split("/").pop()));
    }

    if (request.headers.has("x-rbac-secret-key")) {
      apiSawOperatorKey = true;
    }

    const form = await request.formData();
    const data = JSON.parse(String(form.get("data")));

    if (path.endsWith("/authentication/refresh")) {
      refreshCalls += 1;

      if (!refreshTokens.delete(data.refresh)) {
        return Response.json(
          { message: "Authentication error. Invalid refresh" },
          { status: 401 },
        );
      }

      jwt.verify(data.refresh, secret);
    } else if (!path.endsWith("/email-and-password/authentication")) {
      return new Response(null, { status: 404 });
    }

    const access = jwt.sign({ subject: { id: subjectId } }, secret, {
      expiresIn: 3,
      jwtid: randomUUID(),
    });
    const refresh = jwt.sign({ subject: { id: subjectId } }, secret, {
      expiresIn: 20,
      jwtid: randomUUID(),
    });
    refreshTokens.add(refresh);
    return Response.json({ data: { jwt: access, refresh } });
  },
});
const probe = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch: () => new Response(),
});
const port = probe.port!;
probe.stop(true);
const base = `http://127.0.0.1:${port}`;
const redis = new Redis({ host: "127.0.0.1", port: redisPort });
const child = spawn(process.execPath, ["--no-env-file", "http.ts"], {
  cwd: resolve("apps/mcp"),
  env: {
    ...process.env,
    NODE_ENV: "production",
    API_SERVICE_URL: rbac.url.origin,
    MCP_SERVICE_PUBLIC_BASE_URL: base,
    MCP_SERVICE_PUBLIC_URL: `${base}/mcp`,
    MCP_SERVICE_HTTP_HOST: "127.0.0.1",
    MCP_SERVICE_HTTP_PORT: String(port),
    MCP_SERVICE_AUTH_REQUIRED: "true",
    MCP_SERVICE_ALLOW_RBAC_SECRET_FALLBACK: "false",
    MCP_SERVICE_OAUTH_STORE: "redis",
    KV_PROVIDER: "redis",
    KV_HOST: "127.0.0.1",
    KV_PORT: String(redisPort),
    KV_PASSWORD: "",
    RBAC_JWT_SECRET: secret,
    RBAC_SECRET_KEY: secret,
    MCP_SERVICE_OAUTH_JWT_SECRET: secret,
    MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET: secret,
    RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS: "3",
    RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS: "20",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let childLog = "";
child.stdout.on("data", (chunk) => {
  childLog += String(chunk);
});
child.stderr.on("data", (chunk) => {
  childLog += String(chunk);
});

beforeAll(async () => {
  const deadline = Date.now() + 15000;
  let ready = false;

  while (!ready && Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`MCP startup failed: ${childLog}`);
    }

    try {
      ready = (await fetch(`${base}/.well-known/oauth-protected-resource/mcp`))
        .ok;
    } catch {
      await Bun.sleep(100);
    }
  }

  expect(ready).toBe(true);
});

afterAll(async () => {
  if (child.exitCode === null && child.signalCode === null) {
    const exited = once(child, "exit");
    child.kill("SIGTERM");
    await exited;
  }

  redis.disconnect();
  rbac.stop(true);
  sink.stop(true);
});

async function tokenRequest(fields: Record<string, string>) {
  return fetch(`${base}/oauth/token`, {
    method: "POST",
    body: new URLSearchParams(fields),
  });
}

async function signIn() {
  const callback = "http://127.0.0.1:53316/callback";
  const clientResponse = await fetch(`${base}/oauth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ redirect_uris: [callback] }),
  });
  expect(clientResponse.status).toBe(201);
  const { client_id: clientId } = await clientResponse.json();
  const verifier = randomBytes(32).toString("base64url");
  const challenge = new Bun.CryptoHasher("sha256")
    .update(verifier)
    .digest("base64url");
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: callback,
    code_challenge: challenge,
    code_challenge_method: "S256",
    scope: "mcp:content",
  });
  const consent = await fetch(`${base}/oauth/authorize?${params}`);
  const html = await consent.text();
  expect(html).toContain("your role permits it");
  expect(html).not.toContain("allow_delete");
  params.set("consent", "approve");
  params.set("email", "fixture@example.com");
  params.set("password", "synthetic-password");
  const authorization = await fetch(`${base}/oauth/authorize`, {
    method: "POST",
    body: params,
    redirect: "manual",
  });
  expect(authorization.status).toBe(302);
  const code = new URL(authorization.headers.get("location")!).searchParams.get(
    "code",
  )!;
  const request = {
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: callback,
    code,
    code_verifier: verifier,
  };
  const responses = await Promise.all([
    tokenRequest(request),
    tokenRequest(request),
  ]);
  expect(responses.map((response) => response.status).sort()).toEqual([
    200, 400,
  ]);
  const successful = responses.find((response) => response.status === 200)!;
  return { clientId, tokens: await successful.json() };
}

async function initialize(token: string) {
  return fetch(`${base}/mcp`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "auth-review", version: "1" },
      },
    }),
  });
}

test("MCP renews expired access through RBAC, rotates once in Redis and keeps RBAC lifetimes", async () => {
  const { clientId, tokens } = await signIn();
  expect(tokens.scope).toBe("mcp:content");
  expect(tokens.expires_in).toBeLessThanOrEqual(3);
  expect((await initialize(tokens.access_token)).status).toBe(200);
  const accessId = (jwt.decode(tokens.access_token) as jwt.JwtPayload).jti!;
  const saved = JSON.parse((await redis.get(`mcp:oauth:access:${accessId}`))!);
  expect(saved.rbacSubjectId).toBe(subjectId);
  expect(saved.rbacSubjectRefreshJwt).toBeUndefined();
  expect(
    await redis.ttl(`mcp:oauth:refresh:${tokens.refresh_token}`),
  ).toBeLessThanOrEqual(20);
  expect(await redis.ttl(`mcp:oauth:client:${clientId}`)).toBeLessThanOrEqual(
    20,
  );
  const oldRefresh = JSON.parse(
    (await redis.get(`mcp:oauth:refresh:${tokens.refresh_token}`))!,
  );
  expect(oldRefresh.rbacSubjectRefreshJwt).toBeTruthy();
  await Bun.sleep(3200);
  expect((await initialize(tokens.access_token)).status).toBe(401);
  const request = {
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: tokens.refresh_token,
  };
  const results = await Promise.all([
    tokenRequest(request),
    tokenRequest(request),
  ]);
  expect(results.map((response) => response.status).sort()).toEqual([200, 400]);
  const renewed = await results
    .find((response) => response.status === 200)!
    .json();
  expect(renewed.refresh_token).not.toBe(tokens.refresh_token);
  expect((await initialize(renewed.access_token)).status).toBe(200);
  expect(refreshCalls).toBe(1);
  expect(apiSawOperatorKey).toBe(false);
  expect(
    await redis.get(`mcp:oauth:refresh:${tokens.refresh_token}`),
  ).toBeNull();
  const renewedId = (jwt.decode(renewed.access_token) as jwt.JwtPayload).jti!;
  const savedRenewed = JSON.parse(
    (await redis.get(`mcp:oauth:access:${renewedId}`))!,
  );
  expect(savedRenewed.rbacSubjectAuthenticationJwt).not.toBe(
    saved.rbacSubjectAuthenticationJwt,
  );
});

test("API redirects receive no forwarded credentials or request body", async () => {
  process.env.API_SERVICE_URL = rbac.url.origin;
  process.env.RBAC_SECRET_KEY = "synthetic-operator-key";
  const { installMcpFetchAuthForwarding, runWithMcpRequestAuthContext } =
    await import("../../apps/mcp/lib/auth-context");
  installMcpFetchAuthForwarding();

  for (const status of [301, 302, 303, 307, 308]) {
    await expect(
      fetch(`${rbac.url.origin}/redirect/${status}`, { redirect: "follow" }),
    ).rejects.toThrow();
    await expect(
      runWithMcpRequestAuthContext(
        { authorization: "Bearer synthetic-jwt" },
        () =>
          fetch(
            new Request(`${rbac.url.origin}/redirect/${status}`, {
              method: "POST",
              body: "synthetic-password-or-refresh",
              redirect: "follow",
            }),
          ),
      ),
    ).rejects.toThrow();
  }

  expect(sinkHits).toBe(0);
});
