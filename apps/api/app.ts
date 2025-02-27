import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic, createBunWebSocket } from "hono/bun";
import { type ServerWebSocket } from "bun";
import { ExceptionFilter, ParseQueryMiddleware } from "@sps/shared-backend-api";
import {
  IsAuthorizedMiddleware,
  RevalidationMiddleware,
  HTTPCacheMiddleware,
  ObserverMiddleware,
  RequestIdMiddleware,
} from "@sps/middlewares";
import { MIDDLEWARE_HTTP_CACHE } from "@sps/shared-utils";
import { v4 as uuidv4 } from "uuid";

import { app as telegramApp } from "@sps/telegram/backend/app/api";
import { app as agentApp } from "@sps/agent/backend/app/api";
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
import { ContentfulStatusCode } from "hono/utils/http-status";
import { websocketManager } from "@sps/backend-utils";

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
    ],
    credentials: true,
    maxAge: 86400,
  }),
);

const exceptionFilter = new ExceptionFilter();
app.onError((err, c) => exceptionFilter.catch(err, c));

const requestIdMiddleware = new RequestIdMiddleware();
app.use(requestIdMiddleware.init());

app.options("*", (c) => {
  return c.text("OK", 204 as ContentfulStatusCode);
});

const observerMiddleware = new ObserverMiddleware();
app.use(observerMiddleware.init());

app.use("/public/*", serveStatic({ root: "./" }));

app.get(
  "/ws/revalidation",
  upgradeWebSocket((c) => {
    const clientId = c.req.header("X-Client-ID") || uuidv4();

    return {
      onOpen(event, ws) {
        websocketManager.addClient(clientId, ws);
      },
      onMessage(event, ws) {
        console.log(`Message from client: ${event.data}`);
        ws.send("Hello from server!");
      },
      onClose: () => {
        websocketManager.removeClient(clientId);
      },
    };
  }),
);

/**
 * It's not secure, because authorized requests can be cached and served to unauthorized users.
 * But perfomance of the application will rediqulesly increase.
 * Now added "Cache-Control": "no-store" for preventing caching of authorized requests,
 * but it should be added to the request
 */
const httpCacheMiddleware = new HTTPCacheMiddleware();
httpCacheMiddleware.setRoutes(app);
if (MIDDLEWARE_HTTP_CACHE === "true") {
  app.use(httpCacheMiddleware.init());
}

const isAuthorizedMiddleware = new IsAuthorizedMiddleware();
app.use(isAuthorizedMiddleware.init());

const revalidationMiddleware = new RevalidationMiddleware();
app.use(revalidationMiddleware.init());
// revalidationMiddleware.setRoutes(app);

const parseQueryMiddleware = new ParseQueryMiddleware();
app.use(parseQueryMiddleware.init());

app.route("/api/telegram", telegramApp.hono);
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
