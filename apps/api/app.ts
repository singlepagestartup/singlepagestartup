import { Hono } from "hono";
import { cors } from "hono/cors";
import { createBunWebSocket } from "hono/bun";
import { join, normalize } from "node:path";
import { type ServerWebSocket } from "bun";
import {
  ExceptionFilter,
  ParseQueryMiddleware,
  createConsistencyRuntime,
} from "@sps/shared-backend-api";
import {
  IsAuthorizedMiddleware,
  RevalidationMiddleware,
  HTTPCacheMiddleware,
  ObserverMiddleware,
  RequestIdMiddleware,
  ActionLoggerMiddleware,
  BillRouteMiddleware,
  OperatorSecretMiddleware,
  controllerGuardedRoutes,
} from "@sps/middlewares";
import {
  MIDDLEWARE_HTTP_CACHE,
  RBAC_JWT_SECRET,
  expandLegacyTopics,
} from "@sps/shared-utils";
import { v4 as uuidv4 } from "uuid";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { websocketManager, verifyJwt } from "@sps/backend-utils";

import { app as agentApp } from "@sps/agent/backend/app/api";
import { app as analyticApp } from "@sps/analytic/backend/app/api";
import { app as hostApp } from "@sps/host/backend/app/api";
import { app as rbacApp } from "@sps/rbac/backend/app/api";
import { app as startupApp } from "@sps/startup/backend/app/api";
import { app as crmApp } from "@sps/crm/backend/app/api";
import { app as ecommerceApp } from "@sps/ecommerce/backend/app/api";
import { app as notificationApp } from "@sps/notification/backend/app/api";
import { app as blogApp } from "@sps/blog/backend/app/api";
import { app as billingApp } from "@sps/billing/backend/app/api";
import { app as websiteBuilderApp } from "@sps/website-builder/backend/app/api";
import { app as broadcastApp } from "@sps/broadcast/backend/app/api";
import { app as fileStorageApp } from "@sps/file-storage/backend/app/api";
import { app as socialApp } from "@sps/social/backend/app/api";
import { app as knowledgeApp } from "@sps/knowledge/backend/app/api";

export const app = new Hono().basePath("/");
const { upgradeWebSocket } = createBunWebSocket<ServerWebSocket>();

app.use(
  cors({
    origin: (origin) => {
      if (!origin) {
        return null;
      }

      return origin;
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: [
      "X-CSRF-Token",
      "X-Requested-With",
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Set-Cookie",
      "Cache-Control",
      "X-RBAC-SECRET-KEY",
      "X-SPS-Consistency",
      "X-SPS-Query-Tag",
    ],
    credentials: true,
    exposeHeaders: ["x-sps-consistency"],
    maxAge: 86400,
  }),
);

const exceptionFilter = new ExceptionFilter();
app.onError((err, c) => exceptionFilter.catch(err, c));

app.on(["GET", "HEAD"], "/public/*", async (c) => {
  const relativePath = normalize(
    decodeURIComponent(c.req.path.replace(/^\/public\/?/, "")),
  );

  if (!relativePath || relativePath.startsWith("..")) {
    return c.notFound();
  }

  const publicRoots = [
    join(process.cwd(), "public"),
    join(process.cwd(), "apps/api/public"),
  ];

  for (const publicRoot of publicRoots) {
    const filePath = join(publicRoot, relativePath);

    if (!filePath.startsWith(publicRoot)) {
      continue;
    }

    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      continue;
    }

    const headers = new Headers();
    if (file.type) {
      headers.set("Content-Type", file.type);
    }
    headers.set("Content-Length", String(file.size));

    if (c.req.method === "HEAD") {
      return new Response(null, {
        headers,
      });
    }

    return new Response(await file.arrayBuffer(), {
      headers,
    });
  }

  return c.notFound();
});

const requestIdMiddleware = new RequestIdMiddleware();
app.use(requestIdMiddleware.init());

const consistencyMode = process.env.SPS_CONSISTENCY_MODE || "compatibility";
if (!["off", "observe", "compatibility", "enabled"].includes(consistencyMode))
  throw new Error("Invalid SPS_CONSISTENCY_MODE");
export const consistencyRuntime = createConsistencyRuntime({
  verifyAuthorization: async (authorization) => {
    if (!authorization) return; // Only anonymous query capabilities can match.
    if (!RBAC_JWT_SECRET) throw new Error("JWT verification is not configured");
    await verifyJwt(authorization.replace(/^Bearer\s+/i, ""), RBAC_JWT_SECRET);
  },
  invalidateTags: async (tags) => {
    await revalidationMiddleware.revalidateTags(tags, true);
  },
  publishLegacy: async (topics) => {
    topics = expandLegacyTopics(topics);
    await httpCacheMiddleware.invalidateTopics(topics);
    const now = Date.now();
    websocketManager.broadcastMessage({
      slug: "revalidation",
      payload: "/api",
      topics,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 60000).toISOString(),
    });
  },
});
if (consistencyMode !== "off")
  app.use(
    consistencyRuntime.middleware({ metadata: consistencyMode !== "observe" }),
  );
app.post("/api/consistency/check", async (c) => {
  const body = await c.req.json();
  if (
    !Array.isArray(body.refs) ||
    body.refs.length > 100 ||
    !body.refs.every(
      (ref: unknown) => typeof ref === "string" && ref.length < 128,
    )
  )
    return c.json({ error: "Invalid refs" }, 400);
  const authorization = c.req.header("Authorization") || "";
  return c.json({
    data: await consistencyRuntime.check(body.refs, authorization),
  });
});
app.get(
  "/api/consistency/status",
  new OperatorSecretMiddleware().init(),
  async (c) =>
    c.json({
      data: {
        ...(await consistencyRuntime.store.diagnostics()),
        ...consistencyRuntime.metrics(),
      },
    }),
);

app.options("*", (c) => {
  return c.text("OK", 204 as ContentfulStatusCode);
});

const observerMiddleware = new ObserverMiddleware();
app.use(observerMiddleware.init());

app.get(
  "/ws/revalidation",
  upgradeWebSocket((c) => {
    const clientId = c.req.header("X-Client-ID") || uuidv4();
    let consistencySocket:
      | { send: (message: string) => void; close: () => void }
      | undefined;

    return {
      onOpen(event, ws) {
        websocketManager.addClient(clientId, ws);
        consistencySocket = {
          send: (message) => ws.send(message),
          close: () => ws.close(),
        };
      },
      onMessage(event, ws) {
        if (consistencyMode === "off" || !consistencySocket) return;
        // Modern clients reconcile through their private query capabilities.
        void consistencyRuntime
          .receive(consistencySocket, String(event.data))
          .catch(() => ws.close(1008, "Invalid subscription"));
      },
      onClose: () => {
        websocketManager.removeClient(clientId);
        if (consistencySocket) consistencyRuntime.disconnect(consistencySocket);
      },
    };
  }),
);

/**
 * Ordering contract (issue #195): RevalidationMiddleware MUST be registered
 * BEFORE HTTPCacheMiddleware. Hono unwinds post-next() code inner-first, so
 * the inner http-cache version bump completes before the outer revalidation
 * WS broadcast. Otherwise another client's immediate refetch (triggered by
 * the broadcast) could be served a stale cached response.
 */
const revalidationMiddleware = new RevalidationMiddleware();
app.use(revalidationMiddleware.init());

/**
 * Construct the invalidator independently of HTTP cache registration: direct
 * service writes must bump topic versions before Next/WS revalidation, including
 * when this process does not cache responses. GET caching remains opt-in through
 * MIDDLEWARE_HTTP_CACHE below; scoped reads also need exclusions or no-store.
 */
const httpCacheMiddleware = new HTTPCacheMiddleware();

const actionLoggerMiddleware = new ActionLoggerMiddleware();
app.use(actionLoggerMiddleware.init());

const isAuthorizedMiddleware = new IsAuthorizedMiddleware();
app.use(isAuthorizedMiddleware.init());

const billRouteMiddleware = new BillRouteMiddleware();
app.use(billRouteMiddleware.init());

const parseQueryMiddleware = new ParseQueryMiddleware();
app.use(parseQueryMiddleware.init());

if (MIDDLEWARE_HTTP_CACHE === "true") {
  if (consistencyMode !== "off")
    app.use(
      consistencyRuntime.cache({
        observe: consistencyMode === "observe",
        excludedRoutes: controllerGuardedRoutes,
      }),
    );
  else app.use(httpCacheMiddleware.init());
  httpCacheMiddleware.setRoutes(app);
}

app.route("/api/agent", agentApp.hono);
app.route("/api/host", hostApp.hono);
app.route("/api/rbac", rbacApp.hono);
app.route("/api/startup", startupApp.hono);
app.route("/api/crm", crmApp.hono);
app.route("/api/ecommerce", ecommerceApp.hono);
app.route("/api/notification", notificationApp.hono);
app.route("/api/blog", blogApp.hono);
app.route("/api/billing", billingApp.hono);
app.route("/api/website-builder", websiteBuilderApp.hono);
app.route("/api/broadcast", broadcastApp.hono);
app.route("/api/file-storage", fileStorageApp.hono);
app.route("/api/analytic", analyticApp.hono);
app.route("/api/social", socialApp.hono);
app.route("/api/knowledge", knowledgeApp.hono);
await consistencyRuntime.store.assertCoverage();
consistencyRuntime.start();
