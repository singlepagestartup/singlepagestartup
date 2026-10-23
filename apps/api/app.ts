import type { Service as SubjectService } from "@sps/rbac/models/subject/backend/app/api/src/lib/service";
import type {
  Service as SubjectRoleService,
  IRevocationDependencies,
} from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/service/singlepage";
import { getTableColumns } from "drizzle-orm";
import {
  Service as ProtectedBlogGraph,
  type IPrivateRoot,
} from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/blog/article/graph";
import {
  ProtectedBlogContent,
  protectedContentRoutes,
  RawSocialProfileRead,
  rawSocialProfileReadRoutes,
} from "@sps/rbac/models/subject/backend/app/middlewares";
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

interface IComposedModuleEntry {
  type: "model" | "relation";
  route: string;
  app: {
    controller: {
      service: import("@sps/shared-backend-api").IService<
        Record<string, unknown>
      >;
    };
  };
}
function moduleEntries(module: unknown): IComposedModuleEntry[] {
  const registry = module as { apps?: { apps?: IComposedModuleEntry[] } };
  if (!Array.isArray(registry.apps?.apps))
    throw new Error("Module service registry is not configured");
  return registry.apps.apps;
}
const currentSubjectService = moduleEntries(rbacApp).find(
  (entry) => entry.route === "/subjects",
)!.app.controller.service as unknown as SubjectService;
const roleRevocation: IRevocationDependencies = {
  async revoke(grant) {
    const [owners, requirements] = await Promise.all([
      currentSubjectService.subjectsToEcommerceModuleOrders.find({
        params: {
          filters: {
            and: [
              { column: "subjectId", method: "eq", value: grant.subjectId },
            ],
          },
        },
      }),
      currentSubjectService.rolesToEcommerceModuleProducts.find({
        params: {
          filters: {
            and: [{ column: "roleId", method: "eq", value: grant.roleId }],
          },
        },
      }),
    ]);
    const products = new Set(
      requirements.map((link) => link.ecommerceModuleProductId),
    );
    for (const owner of owners) {
      const order =
        await currentSubjectService.ecommerceModule.order.findByIdExtended({
          id: owner.ecommerceModuleOrderId,
        });
      if (
        order?.ordersToProducts?.some((line: { productId: string }) =>
          products.has(line.productId),
        )
      )
        await currentSubjectService.ecommerceModule.order.revokeSubscription({
          id: owner.ecommerceModuleOrderId,
        });
    }
  },
  async canFulfill(grant, scope) {
    const [owners, requirements] = await Promise.all([
      currentSubjectService.subjectsToEcommerceModuleOrders.find({
        params: {
          filters: {
            and: [
              { column: "subjectId", method: "eq", value: scope.subjectId },
            ],
          },
        },
      }),
      currentSubjectService.rolesToEcommerceModuleProducts.find({
        params: {
          filters: {
            and: [{ column: "roleId", method: "eq", value: grant.roleId }],
          },
        },
      }),
    ]);
    if (!owners.some((owner) => owner.ecommerceModuleOrderId === scope.orderId))
      return false;
    const order =
      await currentSubjectService.ecommerceModule.order.findByIdExtended({
        id: scope.orderId,
      });
    const products = new Set(
      requirements.map((link) => link.ecommerceModuleProductId),
    );
    if (
      !order ||
      !["delivered", "completed", "canceling", "canceled"].includes(
        order.status,
      ) ||
      !order.ordersToProducts.some((line: { productId: string }) =>
        products.has(line.productId),
      )
    )
      return false;
    const now = Date.now();
    for (const owner of owners)
      if (owner.ecommerceModuleOrderId !== scope.orderId) {
        const active =
          await currentSubjectService.ecommerceModule.order.findByIdExtended({
            id: owner.ecommerceModuleOrderId,
          });
        if (
          active &&
          ["delivering", "requested_cancelation"].includes(active.status) &&
          !active.subscriptionRevokedAt &&
          active.subscriptionPeriodInvoiceId &&
          new Date(active.subscriptionPeriodEndsAt).getTime() > now &&
          active.ordersToProducts.some((line: { productId: string }) =>
            products.has(line.productId),
          )
        )
          return false;
      }
    const attributes =
      await currentSubjectService.ecommerceModule.order.findByIdCheckoutAttributes(
        { id: scope.orderId },
      );
    return (
      attributes?.type === "one_off" ||
      (attributes?.type === "subscription" &&
        ((["canceling", "canceled"].includes(order.status) &&
          !!order.subscriptionRevokedAt) ||
          (!!order.subscriptionPeriodInvoiceId &&
            now >= new Date(order.subscriptionPeriodEndsAt).getTime())))
    );
  },
};
currentSubjectService.subjectsToRoles.configureRevocation(roleRevocation);
(
  moduleEntries(rbacApp).find((entry) => entry.route === "/subjects-to-roles")!
    .app.controller.service as unknown as SubjectRoleService
).configureRevocation(roleRevocation);

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

const protectedGraphServices: import("@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/blog/article/graph").IGraphServices =
  {};
for (const [name, module] of Object.entries({
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
})) {
  for (const entry of moduleEntries(module))
    protectedGraphServices[`${name}${entry.route}`] = entry.app.controller
      .service as unknown as import("@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/blog/article/graph").IGraphReader;
}
const protectedBlogContent = new ProtectedBlogContent(
  () =>
    new ProtectedBlogGraph(
      protectedGraphServices,
      async (root: IPrivateRoot) => {
        const modules = [
          hostApp,
          rbacApp,
          startupApp,
          crmApp,
          ecommerceApp,
          notificationApp,
          blogApp,
          billingApp,
          analyticApp,
          socialApp,
          knowledgeApp,
          agentApp,
        ];
        const references = [
          ["websiteBuilderModuleWidgetId", "website-builder/widgets"],
          ["fileStorageModuleFileId", "file-storage/files"],
          ["featureId", "website-builder/features"],
          ["sliderId", "website-builder/sliders"],
          ["slideId", "website-builder/slides"],
          ["buttonsArrayId", "website-builder/buttons-arrays"],
          ["buttonId", "website-builder/buttons"],
          ["logotypeId", "website-builder/logotypes"],
        ] as const;
        for (const module of modules)
          for (const entry of moduleEntries(module)) {
            if (entry.type !== "relation") continue;
            const service = entry.app.controller.service;
            const table = service.repository?.configuration?.repository.Table;
            if (!table)
              throw new Error(
                "Conflict error. Incoming graph ownership cannot be verified",
              );
            const columns = getTableColumns(table);
            for (const [column, resource] of references) {
              const ids = [...(root.nodes.get(resource) || [])];
              if (!ids.length || !(column in columns)) continue;
              const incoming = await service.find({
                params: {
                  filters: { and: [{ column, method: "inArray", value: ids }] },
                },
              });
              if (
                incoming.some(
                  (link) =>
                    !(
                      entry.route ===
                        "/articles-to-website-builder-module-widgets" &&
                      link.id === root.id
                    ),
                )
              )
                throw new Error(
                  "Conflict error. Fork existing public module references before marking private content",
                );
            }
            if ("externalModule" in columns && "externalWidgetId" in columns) {
              const ids = [
                ...(root.nodes.get("website-builder/widgets") || []),
              ];
              if (!ids.length) continue;
              const incoming = await service.find({
                params: {
                  filters: {
                    and: [
                      {
                        column: "externalModule",
                        method: "eq",
                        value: "website-builder",
                      },
                      {
                        column: "externalWidgetId",
                        method: "inArray",
                        value: ids,
                      },
                    ],
                  },
                },
              });
              if (incoming.length)
                throw new Error(
                  "Conflict error. Fork Host references before marking private content",
                );
            }
          }
      },
    ),
);
app.use(protectedBlogContent.bytes());

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
const httpCacheMiddleware = new HTTPCacheMiddleware({
  excludedRoutes: [...protectedContentRoutes, ...rawSocialProfileReadRoutes],
});

const actionLoggerMiddleware = new ActionLoggerMiddleware();
app.use(actionLoggerMiddleware.init());

const isAuthorizedMiddleware = new IsAuthorizedMiddleware();
app.use(isAuthorizedMiddleware.init());

const billRouteMiddleware = new BillRouteMiddleware();
app.use(billRouteMiddleware.init());

const parseQueryMiddleware = new ParseQueryMiddleware();
app.use(parseQueryMiddleware.init());
app.use(protectedBlogContent.init());
app.use(new RawSocialProfileRead(() => currentSubjectService).init());

if (MIDDLEWARE_HTTP_CACHE === "true") {
  if (consistencyMode !== "off")
    app.use(
      consistencyRuntime.cache({
        observe: consistencyMode === "observe",
        excludedRoutes: [
          ...controllerGuardedRoutes,
          ...protectedContentRoutes,
          ...rawSocialProfileReadRoutes,
        ],
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
