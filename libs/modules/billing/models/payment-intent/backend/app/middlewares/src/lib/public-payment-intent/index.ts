import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import {
  RBAC_PRIVILEGED_CONTEXT_KEY,
  type IRouteRule,
} from "@sps/shared-utils";
import { privateCheckoutFields } from "@sps/billing/models/payment-intent/backend/repository/database";
import qs from "qs";

const privateFields = new Set(privateCheckoutFields);
const rawModelRoute = /^\/api\/billing\/payment-intents(?:\/[^/]+)?\/?$/;
export const privateReadRoutes: IRouteRule[] = [
  {
    regexPath: /^\/api\/billing\/payment-intents(?:\/.*)?$/,
    methods: ["GET", "HEAD"],
  },
];

function privateInput(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return value.some(privateInput);
  }
  for (const [key, child] of Object.entries(value)) {
    if (
      privateFields.has(key) ||
      (key === "column" &&
        typeof child === "string" &&
        privateFields.has(child)) ||
      privateInput(child)
    ) {
      return true;
    }
  }
  return false;
}

function publicResponse(value: unknown): { data: unknown; changed: boolean } {
  if (!value || typeof value !== "object") {
    return { data: value, changed: false };
  }
  if (Array.isArray(value)) {
    const children = value.map(publicResponse);
    return {
      data: children.map((child) => child.data),
      changed: children.some((child) => child.changed),
    };
  }
  let changed = false;
  const data: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (privateFields.has(key)) {
      changed = true;
      continue;
    }
    const projected = publicResponse(child);
    data[key] = projected.data;
    changed ||= projected.changed;
  }
  return { data, changed };
}

export class Middleware {
  init() {
    return createMiddleware(async (c, next) => {
      c.header("Cache-Control", "private, no-store");
      if (
        !c.get(RBAC_PRIVILEGED_CONTEXT_KEY) &&
        rawModelRoute.test(c.req.path)
      ) {
        const query = qs.parse(new URL(c.req.url).search.slice(1));
        if (privateInput(query)) {
          throw new HTTPException(400, {
            message: "Validation error. Checkout recovery fields are private",
          });
        }
        if (["POST", "PUT", "PATCH"].includes(c.req.method)) {
          let body: unknown;
          if (c.req.header("Content-Type")?.includes("application/json")) {
            body = await c.req.json().catch(() => undefined);
          } else {
            const form = await c.req.parseBody();
            if (typeof form.data === "string") {
              try {
                body = JSON.parse(form.data);
              } catch {
                body = undefined;
              }
            }
          }
          if (privateInput(body)) {
            throw new HTTPException(400, {
              message:
                "Validation error. Checkout recovery fields are server managed",
            });
          }
        }
      }
      await next();
      c.header("Cache-Control", "private, no-store");
      if (!c.res.headers.get("Content-Type")?.includes("application/json")) {
        return;
      }
      const payload: unknown = await c.res
        .clone()
        .json()
        .catch(() => undefined);
      const projection = publicResponse(payload);
      if (projection.changed) {
        const headers = new Headers(c.res.headers);
        headers.delete("Content-Length");
        c.res = new Response(JSON.stringify(projection.data), {
          status: c.res.status,
          statusText: c.res.statusText,
          headers,
        });
      }
    });
  }
}
