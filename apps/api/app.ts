import { Hono, type Env } from "hono";
import { cors } from "hono/cors";
import { join, normalize } from "node:path";
import { ExceptionFilter, ParseQueryMiddleware } from "@sps/shared-backend-api";
import {
  IsAuthorizedMiddleware,
  SearchIndexingMiddleware,
  RevalidationMiddleware,
  ConsistencyMiddleware,
  HTTPCacheMiddleware,
  ObserverMiddleware,
  RequestIdMiddleware,
  ActionLoggerMiddleware,
  BillRouteMiddleware,
  controllerGuardedRoutes,
} from "@sps/middlewares";
import { MIDDLEWARE_HTTP_CACHE } from "@sps/shared-utils";
import { rawSocialProfileReadRoutes } from "@sps/rbac/models/subject/backend/app/middlewares";
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

export const app = new Hono<Env>().basePath("/");
const apiModules = {
  host: hostApp,
  rbac: rbacApp,
  startup: startupApp,
  crm: crmApp,
  ecommerce: ecommerceApp,
  notification: notificationApp,
  blog: blogApp,
  billing: billingApp,
  "website-builder": websiteBuilderApp,
  "file-storage": fileStorageApp,
  analytic: analyticApp,
  social: socialApp,
  knowledge: knowledgeApp,
  agent: agentApp,
  broadcast: broadcastApp,
};
hostApp.configureRouting(apiModules);

const revalidationMiddleware = new RevalidationMiddleware();
const consistencyMiddleware = new ConsistencyMiddleware({
  revalidation: revalidationMiddleware,
});
const httpCacheMiddleware = new HTTPCacheMiddleware({
  runtime: consistencyMiddleware.runtime,
  excludedRoutes: [...controllerGuardedRoutes, ...rawSocialProfileReadRoutes],
});

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

app.use("/api/*", new SearchIndexingMiddleware().init());
const exceptionFilter = new ExceptionFilter();
app.onError((error, c) => exceptionFilter.catch(error, c));

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

app.use(new RequestIdMiddleware().init());
app.use(consistencyMiddleware.init());
consistencyMiddleware.registerRoutes(app);
app.options("*", (c) => c.body(null, 204));
app.use(new ObserverMiddleware().init());
app.use(revalidationMiddleware.init());
app.use(new ActionLoggerMiddleware().init());
app.use(new IsAuthorizedMiddleware().init());
app.use(new BillRouteMiddleware().init());
app.use(new ParseQueryMiddleware().init());
app.use(rbacApp.middleware());

if (MIDDLEWARE_HTTP_CACHE === "true") {
  httpCacheMiddleware.registerRoutes(app);
  app.use(httpCacheMiddleware.init());
}

for (const [name, module] of Object.entries(apiModules))
  app.route("/api/" + name, module.hono);

await consistencyMiddleware.start();
