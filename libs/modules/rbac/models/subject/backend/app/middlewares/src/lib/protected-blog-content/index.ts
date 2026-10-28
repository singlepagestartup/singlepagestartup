import { getDrizzle } from "@sps/shared-backend-database-config";
import { withConsistencyDatabase } from "@sps/shared-backend-api";
import { sql } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import {
  authorization,
  readRbacSecret,
  rbacSecretMatches,
  verifyJwt,
} from "@sps/backend-utils";
import { RBAC_JWT_SECRET, type IRouteRule } from "@sps/shared-utils";
import { normalize } from "node:path";
import {
  Service as Graph,
  graphEdges,
  type IPrivateGraph,
} from "../../../../api/src/lib/service/singlepage/blog/article/graph";
import { Service as Access } from "../../../../api/src/lib/service/singlepage/blog/article/access";
import { Service as WriteAccess } from "../../../../api/src/lib/service/singlepage/blog/article/write-access";
export const protectedContentRoutes: IRouteRule[] = [
  { regexPath: /^\/api\/website-builder\/[^/]+(?:\/[^/]+)?\/?$/ },
  { regexPath: /^\/api\/file-storage\/files(?:\/[^/]+(?:\/content)?)?\/?$/ },
  {
    regexPath:
      /^\/api\/blog\/(articles|articles-to-website-builder-module-widgets|articles-to-ecommerce-module-products)(?:\/[^/]+)?\/?$/,
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[^/]+\/blog-module\/articles\/[^/]+\/content$/,
  },
  { regexPath: /^\/public\// },
];
export class Middleware {
  constructor(
    readonly graphFactory: () => Graph = () => {
      throw new Error("Protected content services are not configured");
    },
    readonly transaction?: <T>(operation: () => Promise<T>) => Promise<T>,
  ) {}
  private async principal(
    c: Parameters<ReturnType<typeof createMiddleware>>[0],
  ) {
    const operator = rbacSecretMatches(readRbacSecret(c));
    let subjectId: string | undefined;
    const token = authorization(c);
    if (token && RBAC_JWT_SECRET) {
      try {
        const jwt = await verifyJwt(token, RBAC_JWT_SECRET);
        if (typeof jwt.subject?.["id"] === "string")
          subjectId = jwt.subject["id"];
      } catch {
        /* Public reads retain anonymous scope for an unusable session. */
      }
    }
    return { operator, subjectId };
  }
  private async denied(
    graph: Graph,
    state: IPrivateGraph,
    subjectId?: string,
    operator = false,
  ) {
    const result = new Map<string, Set<string>>();
    if (operator) return result;
    const access = new Access(graph);
    const memo = new Map<string, boolean>();
    for (const [resource, records] of state.scopes)
      for (const [id, roots] of records) {
        for (const root of roots) {
          if (!memo.has(root.articleId))
            memo.set(
              root.articleId,
              (await access.execute({ subjectId, articleId: root.articleId }))
                .state === "granted",
            );
          if (!memo.get(root.articleId)) {
            const ids = result.get(resource) || new Set<string>();
            ids.add(id);
            result.set(resource, ids);
            break;
          }
        }
      }
    return result;
  }
  subject() {
    return createMiddleware(async (c, next) => {
      const token = authorization(c);
      if (!token || !RBAC_JWT_SECRET)
        throw new HTTPException(401, {
          message: "Current Subject session required",
        });
      try {
        const decoded = await verifyJwt(token, RBAC_JWT_SECRET);
        if (decoded.subject?.["id"] !== c.req.param("id"))
          throw new HTTPException(403, {
            message: "Current Subject does not own this operation",
          });
      } catch (error) {
        if (error instanceof HTTPException) throw error;
        throw new HTTPException(401, {
          message: "Invalid current Subject session",
        });
      }
      return next();
    });
  }
  bytes() {
    return createMiddleware(async (c, next) => {
      if (
        !["GET", "HEAD"].includes(c.req.method) ||
        !c.req.path.startsWith("/public/")
      )
        return next();
      try {
        const graph = this.graphFactory();
        const state = await graph.read();
        if (!state.roots.length) return next();
        const relative = normalize(
          decodeURIComponent(c.req.path.replace(/^\/public\/?/, "")),
        ).replace(/^\/+/g, "");
        const ids = [...(state.scopes.get("file-storage/files")?.keys() || [])];
        const files = ids.length
          ? await graph.find("file-storage/files", [
              { column: "id", method: "inArray", value: ids },
            ])
          : [];
        const matches = files.filter(
          (file) =>
            typeof file.file === "string" &&
            normalize(file.file.replace(/^\/+/g, "")) === relative,
        );
        if (matches.length) {
          c.header("Cache-Control", "private, no-store");
          c.header("Vary", "Authorization, Cookie");
          const principal = await this.principal(c);
          const denied = await this.denied(
            graph,
            state,
            principal.subjectId,
            principal.operator,
          );
          if (
            matches.some((file) =>
              denied.get("file-storage/files")?.has(file.id),
            )
          )
            throw new HTTPException(403, {
              message: "Protected media access denied",
            });
        }
        await next();
        if (matches.length) {
          c.header("Cache-Control", "private, no-store");
          c.header("Vary", "Authorization, Cookie");
        }
        return;
      } catch (error) {
        if (error instanceof HTTPException) throw error;
        throw new HTTPException(403, {
          message: "Protected media access could not be verified",
        });
      }
    });
  }
  init() {
    return createMiddleware(async (c, next) => {
      const match = c.req.path.match(
        /^\/api\/([^/]+)\/([^/]+)(?:\/([^/]+))?(?:\/content)?\/?$/,
      );
      const content =
        /^\/api\/rbac\/subjects\/[^/]+\/blog-module\/articles\/[^/]+\/content$/.test(
          c.req.path,
        );
      const resource = match ? `${match[1]}/${match[2]}` : "";
      const rawId = match?.[3]
        ? decodeURIComponent(match[3])
            .toLowerCase()
            .replace(/^\{(.*)\}$/, "$1")
        : undefined;
      const hex = rawId?.replaceAll("-", "");
      const recordId =
        hex && /^[a-f0-9]{32}$/.test(hex)
          ? `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
          : undefined;
      const requestedId = recordId || rawId;

      const relevant =
        content ||
        resource.startsWith("website-builder/") ||
        resource === "file-storage/files" ||
        resource.startsWith("blog/articles");
      const mutation = ["POST", "PATCH", "PUT", "DELETE"].includes(
        c.req.method,
      );
      if (!relevant && !mutation) return next();
      const operation = async () => {
        try {
          const graph = this.graphFactory();
          const state = await graph.read();
          c.set("protectedBlogGraphService", graph);
          c.set("protectedBlogGraph", state);
          const principal = await this.principal(c);
          if (relevant) {
            c.header("Cache-Control", "private, no-store");
            c.header("Vary", "Authorization, Cookie");
          }
          if (["GET", "HEAD"].includes(c.req.method) && !content && match) {
            const denied = await this.denied(
              graph,
              state,
              principal.subjectId,
              principal.operator,
            );
            const ids = [...(denied.get(resource) || [])];
            if (match[3] && match[3] !== "count") {
              if (
                ids.some(
                  (id) =>
                    id.toLowerCase().replaceAll("-", "") ===
                    requestedId?.replaceAll("-", ""),
                )
              )
                throw new HTTPException(403, {
                  message: "Protected content access denied",
                });
            } else if (ids.length) {
              const query = c.get("parsedQuery") || {};
              const filters = query.filters;
              if (
                filters &&
                (Object.keys(filters).some((key) => key !== "and") ||
                  !Array.isArray(filters.and))
              )
                throw new HTTPException(400, {
                  message: "Only conjunctive filters are supported",
                });
              if ((filters?.and?.length || 0) >= 32)
                throw new HTTPException(400, {
                  message: "Too many filters for the required access scope",
                });
              c.set("parsedQuery", {
                ...query,
                filters: {
                  and: [
                    ...(filters?.and || []),
                    { column: "id", method: "notInArray", value: ids },
                  ],
                },
              });
            }
          }
          if (mutation) {
            // The clone leaves the owning controller's multipart/JSON body untouched.
            let payload: unknown;
            if (c.req.method !== "DELETE") {
              const request = c.req.raw.clone();
              const type = request.headers.get("content-type") || "";
              if (type.includes("application/json"))
                payload = await request.json();
              else if (
                type.includes("multipart/form-data") ||
                type.includes("application/x-www-form-urlencoded")
              ) {
                const form = await request.formData();
                if (
                  resource === "file-storage/files" &&
                  requestedId &&
                  state.scopes.get(resource)?.has(requestedId) &&
                  [...form.values()].some((value) => typeof value !== "string")
                )
                  throw new HTTPException(409, {
                    message:
                      "Protected media bytes require an explicit guarded replacement operation",
                  });
                const data = form.get("data");
                payload =
                  typeof data === "string"
                    ? { data: JSON.parse(data) }
                    : undefined;
              }
            }
            const data =
              payload && typeof payload === "object"
                ? (payload as { data?: unknown }).data || payload
                : undefined;
            const writeAccess = new WriteAccess(graph);
            if (Array.isArray(data)) {
              const protectedIds = new Set(
                [...state.scopes.values()].flatMap((records) =>
                  [...records.keys()].map((id) =>
                    id.replace(/[{}-]/g, "").toLowerCase(),
                  ),
                ),
              );
              const touchesProtected = (value: unknown): boolean => {
                if (!value || typeof value !== "object") return false;
                return Object.entries(value).some(
                  ([field, item]) =>
                    ((field === "id" || field.endsWith("Id")) &&
                      typeof item === "string" &&
                      protectedIds.has(
                        item.replace(/[{}-]/g, "").toLowerCase(),
                      )) ||
                    (typeof item === "object" && touchesProtected(item)) ||
                    (resource ===
                      "blog/articles-to-website-builder-module-widgets" &&
                      field === "variant" &&
                      item === "private"),
                );
              };
              if (data.some(touchesProtected))
                throw new HTTPException(409, {
                  message:
                    "Private graph changes require explicit individual operations",
                });
              for (const item of data) {
                if (!item || typeof item !== "object")
                  throw new HTTPException(400, {
                    message: "Invalid bulk mutation item",
                  });
                const body =
                  item.data && typeof item.data === "object" ? item.data : item;
                await writeAccess.execute({
                  resource,
                  method: c.req.method,
                  id: typeof item.id === "string" ? item.id : undefined,
                  data: body,
                  graph: state,
                });
              }
            } else
              await writeAccess.execute({
                resource,
                method: c.req.method,
                id: recordId,
                data: data as Record<string, unknown> | undefined,
                graph: state,
              });
          }
          await next();
          if (mutation && c.res.status >= 400)
            throw new HTTPException(c.res.status as 400, { res: c.res });
        } catch (error) {
          if (error instanceof HTTPException) throw error;
          if (
            error instanceof Error &&
            error.message.startsWith("Conflict error.")
          )
            throw new HTTPException(409, { message: error.message });
          throw new HTTPException(403, {
            message: "Protected content access could not be verified",
          });
        }
      };
      const graphWrite =
        mutation &&
        (relevant ||
          /widgets|files|features|sliders|slides|buttons|logotypes/.test(
            c.req.path,
          ));
      if (!graphWrite) return operation();
      if (this.transaction) return this.transaction(operation);
      return getDrizzle({}).transaction(async (tx) => {
        // All API graph mutations share this transaction lock, including public reuse and marking.
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext('sps:private-blog-graph'))`,
        );
        return withConsistencyDatabase(tx, operation);
      });
    });
  }
}
