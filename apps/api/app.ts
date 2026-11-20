import { Hono, type Env } from "hono";
import { cors } from "hono/cors";
import { join, normalize } from "node:path";
import {
  defaultAppAssembly,
  ExceptionFilter,
  ParseQueryMiddleware,
  RequestBodyFitsLimitMiddleware,
} from "@sps/shared-backend-api";
import {
  IsAuthorizedMiddleware,
  SearchIndexingMiddleware,
  RevalidationMiddleware,
  ConsistencyMiddleware,
  HTTPCacheMiddleware,
  ObserverMiddleware,
  RequestIdMiddleware,
  ActionLoggerMiddleware,
  OperatorSecretAttemptsMiddleware,
  ApiRateLimitMiddleware,
} from "@sps/middlewares";
import { MIDDLEWARE_HTTP_CACHE } from "@sps/shared-utils";
import { getFileContentHeaders, resolveCorsOrigin } from "@sps/backend-utils";
import { moduleBootstrap as agentApp } from "@sps/agent/backend/app/api/src/lib/bootstrap";
import { createService as createWorkAttemptService } from "@sps/agent/models/work-attempt/backend/app/api/src/lib/bootstrap";
import { moduleBootstrap as analyticApp } from "@sps/analytic/backend/app/api/src/lib/bootstrap";
import {
  configureHostRouting,
  moduleBootstrap as hostApp,
} from "@sps/host/backend/app/api/src/lib/bootstrap";
import { moduleBootstrap as rbacApp } from "@sps/rbac/backend/app/api/src/lib/bootstrap";
import { createService as createSubjectService } from "@sps/rbac/models/subject/backend/app/api/src/lib/bootstrap";
import { rbacHttpCacheExcludeRoutes } from "@sps/rbac/models/permission/backend/app/api/src/lib/service/singlepage/http-cache-exclude-routes";
import { moduleBootstrap as startupApp } from "@sps/startup/backend/app/api/src/lib/bootstrap";
import { moduleBootstrap as crmApp } from "@sps/crm/backend/app/api/src/lib/bootstrap";
import { moduleBootstrap as ecommerceApp } from "@sps/ecommerce/backend/app/api/src/lib/bootstrap";
import { createServices as createEcommerceServices } from "@sps/ecommerce/backend/app/api/src/lib/services";
import { moduleBootstrap as billingApp } from "@sps/billing/backend/app/api/src/lib/bootstrap";
import { moduleBootstrap as notificationApp } from "@sps/notification/backend/app/api/src/lib/bootstrap";
import { moduleBootstrap as blogApp } from "@sps/blog/backend/app/api/src/lib/bootstrap";
import { moduleBootstrap as websiteBuilderApp } from "@sps/website-builder/backend/app/api/src/lib/bootstrap";
import { moduleBootstrap as broadcastApp } from "@sps/broadcast/backend/app/api/src/lib/bootstrap";
import { moduleBootstrap as fileStorageApp } from "@sps/file-storage/backend/app/api/src/lib/bootstrap";
import { createServices as createFileStorageServices } from "@sps/file-storage/backend/app/api/src/lib/services";
import { moduleBootstrap as socialApp } from "@sps/social/backend/app/api/src/lib/bootstrap";
import { moduleBootstrap as knowledgeApp } from "@sps/knowledge/backend/app/api/src/lib/bootstrap";

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
configureHostRouting(defaultAppAssembly, apiModules);
const mountedModules = await Promise.all(
  Object.entries(apiModules).map(async ([name, owner]) => {
    const { app } = await owner.bootstrap(defaultAppAssembly);
    return { name, app };
  }),
);
const { app: rbac } = await rbacApp.bootstrap(defaultAppAssembly);
const subjectService = createSubjectService(defaultAppAssembly);
const workAttempts = createWorkAttemptService(defaultAppAssembly);
subjectService.configureCustomerWorkWakeup((taskId) =>
  workAttempts.wakeCustomerWork(taskId),
);
const ecommerce = defaultAppAssembly.getOrCreate(createEcommerceServices);
ecommerce.order.configureExpertArchive((scope) =>
  subjectService.orderWork.captureExpertArchive(scope),
);
defaultAppAssembly
  .getOrCreate(createFileStorageServices)
  .file.configureCommerceReceiptGuard((files) =>
    ecommerce.order.work.protectedReceiptFileIds(files),
  );

const revalidationMiddleware = new RevalidationMiddleware();
const consistencyMiddleware = new ConsistencyMiddleware({
  revalidation: revalidationMiddleware,
});
const httpCacheMiddleware = new HTTPCacheMiddleware({
  runtime: consistencyMiddleware.runtime,
  excludedRoutes: [...rbacHttpCacheExcludeRoutes],
});

app.use(
  cors({
    origin: resolveCorsOrigin,
    allowMethods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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
    exposeHeaders: ["x-sps-consistency", "Retry-After"],
    maxAge: 86400,
  }),
);

app.use(new RequestIdMiddleware().init());
app.use(
  new ApiRateLimitMiddleware({
    resolveSubjectId: (token) => rbac.resolveSubjectId(token),
  }).init(),
);

/**
 * Every route refuses a request body larger than `API_MAX_REQUEST_BODY_BYTES`.
 * Bun's `maxRequestBodySize` (see `server.ts`) refuses a declared length above
 * it before any route runs; this middleware also counts a body without a
 * declared length while a route reads it. Module routes may pass a smaller
 * limit of their own, as the file-storage upload routes do.
 */
const requestBodyFitsLimitMiddleware = new RequestBodyFitsLimitMiddleware();
app.use(requestBodyFitsLimitMiddleware.init());

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

    if (await ecommerce.order.work.isProtectedLegacyReceipt({ relativePath })) {
      c.header("Cache-Control", "private, no-store");
      return c.notFound();
    }

    const headers = getFileContentHeaders(relativePath, file.type);
    if (file.type) {
      headers.set("Content-Type", file.type);
    }
    headers.set("Content-Length", String(file.size));

    if (c.req.method === "HEAD") {
      return new Response(null, {
        headers,
      });
    }

    const buffer = await file.arrayBuffer();

    return new Response(buffer, {
      headers,
    });
  }

  return c.notFound();
});

app.use(consistencyMiddleware.init());
consistencyMiddleware.registerRoutes(app);
app.options("*", (c) => c.body(null, 204));
app.use(new OperatorSecretAttemptsMiddleware().init());
app.use(new ObserverMiddleware().init());
app.use(revalidationMiddleware.init());
app.use(new ActionLoggerMiddleware().init());
app.use(new IsAuthorizedMiddleware().init());
app.use(new ParseQueryMiddleware().init());

if (MIDDLEWARE_HTTP_CACHE === "true") {
  httpCacheMiddleware.registerRoutes(app);
  app.use(httpCacheMiddleware.init());
}

for (const { name, app: module } of mountedModules) {
  app.route("/api/" + name, module.hono);
}

export function startConsistency() {
  return consistencyMiddleware.start();
}
