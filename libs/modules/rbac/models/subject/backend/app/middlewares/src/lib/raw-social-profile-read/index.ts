import type { FindServiceProps } from "@sps/shared-backend-api";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import {
  authorization,
  readRbacSecret,
  rbacSecretMatches,
  verifyJwt,
} from "@sps/backend-utils";
import { RBAC_JWT_SECRET, type IRouteRule } from "@sps/shared-utils";

interface IRead<T> {
  find(props?: FindServiceProps): Promise<T[]>;
}
export interface IDependencies {
  subjectsToRoles: IRead<{ subjectId: string; roleId: string }>;
  rolesToPermissions: IRead<{ roleId: string; permissionId: string }>;
  permission: IRead<{ id: string; path: string; method: string; type: string }>;
}

/** Named author projections and nested scoped routes are deliberately excluded. */
export const rawSocialProfileReadRoutes: IRouteRule[] = [
  {
    regexPath: /^\/api\/social\/profiles(?:\/(?!authors(?:\/|$))[^/]+)?\/?$/,
    methods: ["GET", "HEAD"],
  },
];

export class Middleware {
  constructor(readonly service: () => IDependencies) {}

  init() {
    return createMiddleware(async (c, next) => {
      if (!["GET", "HEAD"].includes(c.req.method)) return next();
      let path: string;
      try {
        path = decodeURIComponent(c.req.path).replace(/\/$/, "");
      } catch {
        throw new HTTPException(400, {
          message: "Invalid Profile resource path",
        });
      }
      const match = /^\/api\/social\/profiles(?:\/([^/]+))?$/.exec(path);
      if (!match || match[1] === "authors") return next();
      c.header("Cache-Control", "private, no-store");
      c.header("Vary", "Authorization, Cookie");
      if (rbacSecretMatches(readRbacSecret(c))) return next();

      const token = authorization(c);
      if (!token || !RBAC_JWT_SECRET)
        throw new HTTPException(403, {
          message: "Administrative Profile access required",
        });
      try {
        const decoded = await verifyJwt(token, RBAC_JWT_SECRET);
        const subjectId = decoded.subject?.["id"];
        if (typeof subjectId !== "string" || !subjectId)
          throw new Error("No current Subject");
        const service = this.service();
        const assignments = await service.subjectsToRoles.find({
          params: {
            filters: {
              and: [{ column: "subjectId", method: "eq", value: subjectId }],
            },
          },
        });
        const roleIds = [
          ...new Set(
            assignments
              .filter((item) => item.subjectId === subjectId)
              .map((item) => item.roleId),
          ),
        ];
        if (!roleIds.length) throw new Error("No administrative Role");
        const suffix = match[1];
        const hex = suffix?.replace(/[{}-]/g, "").toLowerCase();
        const canonicalId =
          hex && /^[0-9a-f]{32}$/.test(hex)
            ? `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
            : undefined;
        const paths = ["*", path];
        if (canonicalId)
          paths.push(
            `/api/social/profiles/${canonicalId}`,
            "/api/social/profiles/[social.profiles.id]",
          );
        const permissions = await service.permission.find({
          params: {
            filters: {
              and: [
                {
                  column: "path",
                  method: "inArray",
                  value: [...new Set(paths)],
                },
                { column: "method", method: "inArray", value: ["GET", "*"] },
                { column: "type", method: "eq", value: "HTTP" },
              ],
            },
          },
        });
        const permissionIds = permissions
          .filter(
            (permission) =>
              permission.type === "HTTP" &&
              paths.includes(permission.path) &&
              (permission.path === "*"
                ? ["GET", "*"].includes(permission.method)
                : permission.method === "GET"),
          )
          .map((permission) => permission.id);
        if (!permissionIds.length)
          throw new Error("No administrative Permission");
        // Read bindings afresh: cached roleless policy and revoked roles cannot authorize raw rows.
        const bindings = await service.rolesToPermissions.find({
          params: {
            filters: {
              and: [
                { column: "roleId", method: "inArray", value: roleIds },
                {
                  column: "permissionId",
                  method: "inArray",
                  value: permissionIds,
                },
              ],
            },
          },
        });
        if (
          !bindings.some(
            (binding) =>
              roleIds.includes(binding.roleId) &&
              permissionIds.includes(binding.permissionId),
          )
        )
          throw new Error("No explicit administrative Permission binding");
      } catch {
        throw new HTTPException(403, {
          message: "Administrative Profile access required",
        });
      }
      await next();
      c.header("Cache-Control", "private, no-store");
      c.header("Vary", "Authorization, Cookie");
    });
  }
}
