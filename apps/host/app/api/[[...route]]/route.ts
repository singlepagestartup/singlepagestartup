import { Hono } from "hono";
import { handle } from "hono/vercel";
import { type NextRequest } from "next/server";
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
import { ExceptionFilter } from "@sps/shared-backend-api";
import { ErrorHandler } from "hono/types";
import {
  IsAuthorizedMiddleware,
  RevalidationMiddleware,
  HTTPCacheMiddleware,
  ObserverMiddleware,
} from "@sps/middlewares";
import { MIDDLEWARE_HTTP_CACHE } from "@sps/shared-utils";
import { ParseQueryMiddleware } from "@sps/shared-backend-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const app = new Hono<any, any, any>().basePath("/api");

app.onError(new ExceptionFilter().catch as unknown as ErrorHandler<any>);

app.use(new ObserverMiddleware().init());

/**
 * It's not secure, because authorized requests can be cached and served to unauthorized users.
 * But perfomance of the application will rediqulesly increase.
 * Now added "Cache-Control": "no-cache" for preventing caching of authorized requests,
 * but it should be added to the request
 */
if (MIDDLEWARE_HTTP_CACHE === "true") {
  app.use(new HTTPCacheMiddleware().init());
  new HTTPCacheMiddleware().setRoutes(app);
}

app.use(new IsAuthorizedMiddleware().init());
app.use(new RevalidationMiddleware().init());
new RevalidationMiddleware().setRoutes(app);
app.use(new ParseQueryMiddleware().init());

app.mount("/host", hostApp.hono.fetch);
app.mount("/rbac", rbacApp.hono.fetch);
app.mount("/startup", startupApp.hono.fetch);
app.mount("/crm", crmApp.hono.fetch);
app.mount("/ecommerce", ecommerceApp.hono.fetch);
app.mount("/notification", notificationApp.hono.fetch);
app.mount("/blog", blogApp.hono.fetch);
app.mount("/billing", billingApp.hono.fetch);
app.mount("/website-builder", websiteBuilderApp.hono.fetch);
app.mount("/broadcast", broadcastApp.hono.fetch);
app.mount("/file-storage", fileStorageApp.hono.fetch);

export async function POST(request: NextRequest) {
  return handle(app)(request);
}
export async function GET(request: NextRequest) {
  return handle(app)(request);
}
export async function PATCH(request: NextRequest) {
  return handle(app)(request);
}
export async function DELETE(request: NextRequest) {
  return handle(app)(request);
}
