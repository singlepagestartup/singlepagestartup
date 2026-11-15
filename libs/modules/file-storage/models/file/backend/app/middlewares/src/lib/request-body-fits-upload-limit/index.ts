import { MiddlewareHandler } from "hono";
import { RequestBodyFitsLimitMiddleware } from "@sps/shared-backend-api";
import { FILE_STORAGE_MAX_UPLOAD_BYTES } from "@sps/shared-utils";

export interface IMiddlewareGeneric {}

/**
 * Refuses an upload whose request body is larger than
 * `FILE_STORAGE_MAX_UPLOAD_BYTES` with 413 (issue #304), through the shared
 * request body limit. When a body without a declared length passes the limit,
 * the handler's read fails with Hono's `Payload Too Large` error, which the
 * handler maps to the same category.
 */
export class Middleware {
  init(): MiddlewareHandler<any, any, {}> {
    return new RequestBodyFitsLimitMiddleware({
      maxBytes: FILE_STORAGE_MAX_UPLOAD_BYTES,
      limitName: "upload limit",
    }).init();
  }
}
