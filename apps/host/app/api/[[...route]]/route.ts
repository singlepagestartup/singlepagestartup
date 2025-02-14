import { Hono } from "hono";
import { handle } from "hono/vercel";
import { type NextRequest } from "next/server";
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
import { ExceptionFilter, ParseQueryMiddleware } from "@sps/shared-backend-api";
import {
  IsAuthorizedMiddleware,
  RevalidationMiddleware,
  HTTPCacheMiddleware,
  ObserverMiddleware,
  RequestIdMiddleware,
} from "@sps/middlewares";
import { MIDDLEWARE_HTTP_CACHE } from "@sps/shared-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const fetchCache = "force-no-store";
export const revalidate = 0;

let appInstance: Hono | null = null;
let appHandler: any = null;

function getApp() {
  if (!appInstance) {
    appInstance = new Hono<any, any, any>().basePath("/api");

    const exceptionFilter = new ExceptionFilter();
    appInstance.onError((err, c) => exceptionFilter.catch(err, c));

    const requestIdMiddleware = new RequestIdMiddleware();
    appInstance.use(requestIdMiddleware.init());

    const observerMiddleware = new ObserverMiddleware();
    appInstance.use(observerMiddleware.init());

    /**
     * It's not secure, because authorized requests can be cached and served to unauthorized users.
     * But perfomance of the application will rediqulesly increase.
     * Now added "Cache-Control": "no-store" for preventing caching of authorized requests,
     * but it should be added to the request
     */
    const httpCacheMiddleware = new HTTPCacheMiddleware();
    httpCacheMiddleware.setRoutes(appInstance);
    if (MIDDLEWARE_HTTP_CACHE === "true") {
      appInstance.use(httpCacheMiddleware.init());
    }

    const isAuthorizedMiddleware = new IsAuthorizedMiddleware();
    appInstance.use(isAuthorizedMiddleware.init());

    const revalidationMiddleware = new RevalidationMiddleware();
    appInstance.use(revalidationMiddleware.init());
    revalidationMiddleware.setRoutes(appInstance);

    const parseQueryMiddleware = new ParseQueryMiddleware();
    appInstance.use(parseQueryMiddleware.init());

    appInstance.mount("/telegram", telegramApp.hono.fetch);
    appInstance.mount("/agent", agentApp.hono.fetch);
    appInstance.mount("/host", hostApp.hono.fetch);
    appInstance.mount("/rbac", rbacApp.hono.fetch);
    appInstance.mount("/startup", startupApp.hono.fetch);
    appInstance.mount("/crm", crmApp.hono.fetch);
    appInstance.mount("/ecommerce", ecommerceApp.hono.fetch);
    appInstance.mount("/notification", notificationApp.hono.fetch);
    appInstance.mount("/blog", blogApp.hono.fetch);
    appInstance.mount("/billing", billingApp.hono.fetch);
    appInstance.mount("/website-builder", websiteBuilderApp.hono.fetch);
    appInstance.mount("/broadcast", broadcastApp.hono.fetch);
    appInstance.mount("/file-storage", fileStorageApp.hono.fetch);
  }
  return appInstance;
}

function getAppHandler() {
  if (!appHandler) {
    appHandler = handle(getApp());
  }
  return appHandler;
}

export async function POST(request: NextRequest) {
  return getAppHandler()(request);
}
export async function GET(request: NextRequest) {
  return getAppHandler()(request);
}
export async function PATCH(request: NextRequest) {
  return getAppHandler()(request);
}
export async function DELETE(request: NextRequest) {
  return getAppHandler()(request);
}
