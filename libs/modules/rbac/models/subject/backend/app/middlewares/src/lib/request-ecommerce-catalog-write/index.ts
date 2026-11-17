import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType, readRbacSecret } from "@sps/backend-utils";
import { RBAC_SECRET_KEY, type IRouteRule } from "@sps/shared-utils";
import type {
  Service as Catalog,
  IRecord,
} from "../../../../api/src/lib/service/singlepage/ecommerce/catalog";

const rawCatalogue =
  /^\/api\/(ecommerce)\/(stores|products|attributes|attribute-keys|stores-to-products|stores-to-attributes|products-to-attributes|stores-to-products-to-attributes|attribute-keys-to-attributes|attributes-to-billing-module-currencies|offers-to-offers)(?:\/([^/]+))?\/?$/;
const ownership =
  /^\/api\/(rbac)\/(subjects-to-ecommerce-module-(?:stores|products|orders))(?:\/([^/]+))?\/?$/;
const seller =
  /^\/api\/rbac\/subjects\/([^/]+)\/ecommerce-module\/(offers|catalogue-attributes)\/?$/;
const methods = ["POST", "PATCH", "PUT", "DELETE"];
const privateOrders =
  /^\/api\/ecommerce\/(orders|orders-to-products|orders-to-billing-module-payment-intents)(?:\/.*)?$/;
export const privateOrderRoutes: IRouteRule[] = [
  { regexPath: privateOrders, methods: ["GET", "HEAD"] },
];
const ownedOrderRead =
  /^\/api\/ecommerce\/orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:\/extended)?\/?$/;

export const guardedRoutes: IRouteRule[] = [
  { regexPath: ownedOrderRead, methods: ["GET"] },
  { regexPath: rawCatalogue, methods },
  { regexPath: ownership, methods },
  { regexPath: seller, methods: ["POST"] },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[^/]+\/ecommerce-module\/catalogue-context\/?$/,
    methods: ["GET"],
  },
];

export interface IOptions {
  catalog: Catalog;
  authenticate(
    token: string,
  ): Promise<{ id: string; authenticated: boolean } | undefined>;
}

function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export class Middleware {
  init(options: IOptions) {
    return createMiddleware(async (c, next) => {
      if (privateOrders.test(c.req.path.toLowerCase())) {
        try {
          const operator = Boolean(
            RBAC_SECRET_KEY && readRbacSecret(c) === RBAC_SECRET_KEY,
          );
          const token = c.req
            .header("Authorization")
            ?.match(/^Bearer (\S+)$/i)?.[1];
          const subject = token ? await options.authenticate(token) : undefined;
          if (!operator && !subject?.authenticated) {
            throw new HTTPException(401, {
              message:
                "Authentication error. Private order records require authentication",
            });
          }
          const parts = c.req.path.split("/");
          const itemRead = ownedOrderRead.test(c.req.path.toLowerCase());
          await options.catalog.assertPrivateOrderAccess({
            subjectId: subject?.id,
            operator,
            entity: parts[3],
            id: parts[4],
            method: c.req.method,
            itemRead,
          });
          c.header("Cache-Control", "private, no-store");
          await next();
          c.header("Cache-Control", "private, no-store");
          return;
        } catch (error) {
          if (error instanceof HTTPException) {
            throw error;
          }
          const { status, message, details } = getHttpErrorType(error);
          throw new HTTPException(status, { message, cause: details });
        }
      }
      if (!methods.includes(c.req.method)) {
        await next();
        return;
      }
      const path = c.req.path.toLowerCase();
      const match = rawCatalogue.exec(path) ?? ownership.exec(path);
      const sellerMatch = seller.exec(path);
      if (!match && !sellerMatch) {
        await next();
        return;
      }
      try {
        const operator = Boolean(
          RBAC_SECRET_KEY && readRbacSecret(c) === RBAC_SECRET_KEY,
        );
        const token = c.req
          .header("Authorization")
          ?.match(/^Bearer (\S+)$/i)?.[1];
        const subject = token ? await options.authenticate(token) : undefined;
        if (!subject?.authenticated && (!operator || sellerMatch)) {
          throw new HTTPException(401, {
            message: "Authentication error. A signed-in account is required",
          });
        }
        if (sellerMatch) {
          if (sellerMatch[1] !== subject?.id) {
            throw new HTTPException(403, {
              message: "Permission error. Subject does not match the caller",
            });
          }
          await next();
          return;
        }
        let data: unknown = {};
        if (c.req.method !== "DELETE") {
          const body = await c.req.parseBody();
          if (typeof body.data !== "string") {
            throw new Error(
              "Validation error. Catalogue writes require serialized form data",
            );
          }
          data = JSON.parse(body.data);
        }
        const entity = match![2];
        const routeId = match![3];
        if (!object(data) && routeId !== "bulk") {
          throw new Error("Validation error. Catalogue data must be an object");
        }
        const operation = async () => {
          await next();
          if (c.error) {
            throw c.error;
          }
          if (c.res.status >= 400) {
            throw new HTTPException(c.res.status as 400, {
              message: "Catalogue mutation failed",
            });
          }
          return c.res;
        };
        const createdRecord = async (response: Response) => {
          const json: unknown = await response.clone().json();
          if (
            object(json) &&
            object(json.data) &&
            typeof json.data.id === "string"
          ) {
            return json.data as IRecord;
          }
          return undefined;
        };
        const mutation = {
          subjectId: subject?.id,
          operator,
          entity,
          method: c.req.method,
        };
        if (routeId === "bulk") {
          if (!Array.isArray(data) || !data.length) {
            throw new Error(
              "Validation error. Catalogue batch must contain records",
            );
          }
          const mutations = data.map((row) => {
            if (
              !object(row) ||
              !object(row.data) ||
              (c.req.method !== "POST" && typeof row.id !== "string")
            ) {
              throw new Error(
                "Validation error. Invalid catalogue batch record",
              );
            }
            return {
              ...mutation,
              id: c.req.method === "POST" ? undefined : String(row.id),
              data: row.data,
            };
          });
          await options.catalog.mutateBatch(
            mutations,
            operation,
            async (response) => {
              const json: unknown = await response.clone().json();
              if (object(json) && Array.isArray(json.data)) {
                return json.data.filter(
                  (row): row is IRecord =>
                    object(row) && typeof row.id === "string",
                );
              }
              return [];
            },
          );
        } else if (routeId === "find-or-create") {
          await options.catalog.findOrCreate(
            { ...mutation, data: data as Record<string, unknown> },
            operation,
            createdRecord,
          );
        } else {
          await options.catalog.mutate(
            { ...mutation, id: routeId, data: data as Record<string, unknown> },
            operation,
            createdRecord,
          );
        }
      } catch (error) {
        if (error instanceof HTTPException) {
          throw error;
        }
        const { status, message, details } = getHttpErrorType(error);
        throw new HTTPException(status, { message, cause: details });
      }
    });
  }
}
